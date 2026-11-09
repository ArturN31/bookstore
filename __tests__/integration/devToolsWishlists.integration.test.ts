import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { naturalPairKey } from '@/utils/db/dbSeed/candidatePlanning';
import { addWishlists } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => ({ faker: {} }));

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools wishlist generation integration', () => {
    let admin: SupabaseClient<Database>;
    const userId = randomUUID();
    const username = `wishlist_${userId.replaceAll('-', '').slice(0, 16)}`;
    const email = `${username}@example.test`;
    const bookIds = Array.from({ length: 11 }, () => randomUUID());
    const fixtureWishlistId = randomUUID();
    const generatedWishlistIds = new Set<string>();
    const createdAuthUserIds: string[] = [];

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchAllWishlistEntries = async () => {
        const pageSize = 1000;
        const entries: Array<{ id: string; user_id: string; book_id: string }> = [];
        let offset = 0;
        let page: Array<{ id: string; user_id: string; book_id: string }>;

        do {
            const { data, error } = await admin
                .from('wishlist')
                .select('id, user_id, book_id')
                .order('id')
                .range(offset, offset + pageSize - 1);
            assertNoError(error);
            if (!data) throw new Error('Wishlist lookup returned no data.');

            page = data;
            entries.push(...page);
            offset += pageSize;
        } while (page.length === pageSize);

        return entries;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error: authError } = await admin.auth.admin.createUser({
            id: userId,
            email,
            password: randomUUID(),
            email_confirm: true,
            user_metadata: { username },
        });
        assertNoError(authError);
        createdAuthUserIds.push(userId);

        const { error: profileError } = await admin.from('users').insert({
            id: userId,
            first_name: 'Wishlist',
            last_name: 'Integration',
            date_of_birth: '2000-01-01',
            street_address: '1 Test Street',
            postcode: '00000',
            city: 'Test City',
            country: 'Test Country',
            phone_number: '0000000000',
            username,
        });
        assertNoError(profileError);

        const { error: booksError } = await admin.from('books').insert(
            bookIds.map((id, index) => ({
                id,
                title: `Wishlist Integration ${id}`,
                author: 'Wishlist Integration Test',
                genre: 'Integration',
                publisher: 'Dev Tools Tests',
                publication_date: '2020-01-01',
                price: '10.00',
                description: 'Wishlist integration test fixture.',
                format: 'Paperback',
                page_count: 100,
                image_url: '',
                stock_quantity: 1,
                is_active: true,
            })),
        );
        assertNoError(booksError);

        const { error: wishlistError } = await admin.from('wishlist').insert({
            id: fixtureWishlistId,
            user_id: userId,
            book_id: bookIds[0],
        });
        assertNoError(wishlistError);
    });

    afterAll(async () => {
        if (!admin) return;

        const deleteWishlistEntries = async (ids: string[]) => {
            if (ids.length === 0) return;
            const { error } = await admin.from('wishlist').delete().in('id', ids);
            assertNoError(error);
        };

        try {
            await deleteWishlistEntries([...generatedWishlistIds, fixtureWishlistId]);

            const [booksCleanup, profileCleanup] = await Promise.all([
                admin.from('books').delete().in('id', bookIds),
                admin.from('users').delete().eq('id', userId),
            ]);
            assertNoError(booksCleanup.error);
            assertNoError(profileCleanup.error);

            for (const authUserId of createdAuthUserIds) {
                const { error } = await admin.auth.admin.deleteUser(authUserId);
                assertNoError(error);
            }

            const [remainingWishlist, remainingBooks, remainingProfiles] = await Promise.all([
                admin
                    .from('wishlist')
                    .select('id')
                    .in('id', [...generatedWishlistIds, fixtureWishlistId]),
                admin.from('books').select('id').in('id', bookIds),
                admin.from('users').select('id').eq('id', userId),
            ]);
            assertNoError(remainingWishlist.error);
            assertNoError(remainingBooks.error);
            assertNoError(remainingProfiles.error);
            if (
                remainingWishlist.data?.length ||
                remainingBooks.data?.length ||
                remainingProfiles.data?.length
            )
                throw new Error('Wishlist integration test cleanup left fixture rows behind.');
        } finally {
            createdAuthUserIds.length = 0;
        }
    });

    it('adds exact unique wishlist batches on repeat runs and preserves an existing entry', async () => {
        const authorizeWrite = async () => {};
        const beforeFirstRun = await fetchAllWishlistEntries();
        const beforeFirstIds = new Set(beforeFirstRun.map(({ id }) => id));

        const firstResult = await addWishlists(admin, authorizeWrite);
        expect(firstResult).toEqual({
            message: 'Success: Added 10 wishlist items.',
            success: true,
        });

        const afterFirstRun = await fetchAllWishlistEntries();
        const firstRunEntries = afterFirstRun.filter(({ id }) => !beforeFirstIds.has(id));
        firstRunEntries.forEach(({ id }) => generatedWishlistIds.add(id));
        expect(firstRunEntries).toHaveLength(10);

        const beforeSecondIds = new Set(afterFirstRun.map(({ id }) => id));
        const secondResult = await addWishlists(admin, authorizeWrite);
        expect(secondResult).toEqual({
            message: 'Success: Added 10 wishlist items.',
            success: true,
        });

        const afterSecondRun = await fetchAllWishlistEntries();
        const secondRunEntries = afterSecondRun.filter(({ id }) => !beforeSecondIds.has(id));
        secondRunEntries.forEach(({ id }) => generatedWishlistIds.add(id));
        const generatedEntries = [...firstRunEntries, ...secondRunEntries];
        const generatedKeys = generatedEntries.map(({ user_id, book_id }) =>
            naturalPairKey(user_id, book_id),
        );

        expect(secondRunEntries).toHaveLength(10);
        expect(new Set(generatedKeys).size).toBe(20);
        expect(afterSecondRun).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: fixtureWishlistId,
                    user_id: userId,
                    book_id: bookIds[0],
                }),
            ]),
        );
    });
});
