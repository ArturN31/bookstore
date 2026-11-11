import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { addCarts } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => ({
    faker: { number: { int: jest.fn(() => 1) } },
}));

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools cart generation integration', () => {
    let admin: SupabaseClient<Database>;
    const testPrefix = `CTEST${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const userIds = Array.from({ length: 15 }, () => randomUUID());
    const usernames = userIds.map((id) => `${testPrefix}_${id.slice(0, 8)}`);
    const emails = userIds.map((id) => `cart_${id}@example.test`);
    const bookIds = Array.from({ length: 3 }, () => randomUUID());
    const fixtureCartId = randomUUID();
    const fixtureCartItemId = 2_000_000_000 + Math.floor(Math.random() * 1_000_000);
    const createdAuthUserIds: string[] = [];
    const generatedCartIds = new Set<string>();

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchAllCarts = async () => {
        const pageSize = 1000;
        const carts: Array<{ id: string; user_id: string }> = [];
        let offset = 0;
        let page: Array<{ id: string; user_id: string }>;

        do {
            const { data, error } = await admin
                .from('shopping_carts')
                .select('id, user_id')
                .order('id')
                .range(offset, offset + pageSize - 1);
            assertNoError(error);
            if (!data) throw new Error('Cart lookup returned no data.');

            page = data;
            carts.push(...page);
            offset += pageSize;
        } while (page.length === pageSize);

        return carts;
    };

    const recordNewCarts = async (previousIds: Set<string>) => {
        const carts = await fetchAllCarts();
        const addedCarts = carts.filter(({ id }) => !previousIds.has(id));
        addedCarts.forEach(({ id }) => generatedCartIds.add(id));
        return addedCarts;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        for (let index = 0; index < userIds.length; index += 1) {
            const { error } = await admin.auth.admin.createUser({
                id: userIds[index],
                email: emails[index],
                password: randomUUID(),
                email_confirm: true,
                user_metadata: { username: usernames[index] },
            });
            assertNoError(error);
            createdAuthUserIds.push(userIds[index]);
        }

        const { error: profilesError } = await admin.from('users').insert(
            userIds.map((id, index) => ({
                id,
                first_name: 'Cart',
                last_name: 'Integration',
                date_of_birth: '2000-01-01',
                street_address: '1 Test Street',
                postcode: '00000',
                city: 'Test City',
                country: 'Test Country',
                phone_number: '0000000000',
                username: usernames[index],
            })),
        );
        assertNoError(profilesError);

        const { error: booksError } = await admin.from('books').insert(
            bookIds.map((id, index) => ({
                id,
                title: `${testPrefix} Book ${index}`,
                author: 'Cart Integration Test',
                genre: 'Integration',
                publisher: 'Dev Tools Tests',
                publication_date: '2020-01-01',
                price: '10.00',
                description: 'Cart integration test fixture.',
                format: 'Paperback',
                page_count: 100,
                image_url: '',
                stock_quantity: 1,
                is_active: true,
            })),
        );
        assertNoError(booksError);

        const { error: cartError } = await admin.from('shopping_carts').insert({
            id: fixtureCartId,
            user_id: userIds[0],
        });
        assertNoError(cartError);

        const { error: itemError } = await admin.from('shopping_cart_items').insert({
            id: fixtureCartItemId,
            cart_id: fixtureCartId,
            book_id: bookIds[0],
            quantity: 1,
        });
        assertNoError(itemError);
    });

    afterAll(async () => {
        if (!admin) return;

        try {
            const generatedIds = [...generatedCartIds];
            if (generatedIds.length > 0) {
                const { error: itemsError } = await admin
                    .from('shopping_cart_items')
                    .delete()
                    .in('cart_id', generatedIds);
                assertNoError(itemsError);

                const { error: cartsError } = await admin
                    .from('shopping_carts')
                    .delete()
                    .in('id', generatedIds);
                assertNoError(cartsError);
            }

            const { error: fixtureItemsError } = await admin
                .from('shopping_cart_items')
                .delete()
                .eq('cart_id', fixtureCartId);
            assertNoError(fixtureItemsError);

            const { error: fixtureCartError } = await admin
                .from('shopping_carts')
                .delete()
                .eq('id', fixtureCartId);
            assertNoError(fixtureCartError);

            const { error: booksError } = await admin.from('books').delete().in('id', bookIds);
            assertNoError(booksError);

            const { error: profilesError } = await admin.from('users').delete().in('id', userIds);
            assertNoError(profilesError);

            for (const userId of createdAuthUserIds) {
                const { error } = await admin.auth.admin.deleteUser(userId);
                assertNoError(error);
            }

            const [remainingCarts, remainingBooks, remainingProfiles] = await Promise.all([
                admin
                    .from('shopping_carts')
                    .select('id')
                    .in('id', [...generatedIds, fixtureCartId]),
                admin.from('books').select('id').in('id', bookIds),
                admin.from('users').select('id').in('id', userIds),
            ]);
            assertNoError(remainingCarts.error);
            assertNoError(remainingBooks.error);
            assertNoError(remainingProfiles.error);

            const { data: remainingItems, error: remainingItemsError } = await admin
                .from('shopping_cart_items')
                .select('id')
                .in('cart_id', [...generatedIds, fixtureCartId]);
            assertNoError(remainingItemsError);
            if (
                remainingCarts.data?.length ||
                remainingItems?.length ||
                remainingBooks.data?.length ||
                remainingProfiles.data?.length
            )
                throw new Error('Cart integration test cleanup left fixture rows behind.');
        } finally {
            createdAuthUserIds.length = 0;
        }
    });

    it('adds exact cart/item batches on repeat runs and preserves a pre-existing cart', async () => {
        const authorizeWrite = async () => {};
        const beforeFirstRun = new Set((await fetchAllCarts()).map(({ id }) => id));

        const firstResult = await addCarts(admin, authorizeWrite);
        expect(firstResult).toEqual({
            message: 'Cart Injection: 15 carts populated.',
            success: true,
        });

        const firstRunCarts = await recordNewCarts(beforeFirstRun);
        expect(firstRunCarts).toHaveLength(15);

        const [
            { data: existingUsers, error: usersError },
            { data: existingBooks, error: booksError },
        ] = await Promise.all([admin.from('users').select('id'), admin.from('books').select('id')]);
        assertNoError(usersError);
        assertNoError(booksError);
        if (!existingUsers || !existingBooks)
            throw new Error('Current users or books lookup returned no data.');

        const beforeSecondRun = new Set((await fetchAllCarts()).map(({ id }) => id));
        const secondResult = await addCarts(admin, authorizeWrite);
        expect(secondResult).toEqual({
            message: 'Cart Injection: 15 carts populated.',
            success: true,
        });

        const secondRunCarts = await recordNewCarts(beforeSecondRun);
        expect(secondRunCarts).toHaveLength(15);

        const generatedCarts = [...firstRunCarts, ...secondRunCarts];
        const generatedCartIdsForCheck = generatedCarts.map(({ id }) => id);
        const { data: items, error: itemsError } = await admin
            .from('shopping_cart_items')
            .select('id, cart_id, book_id, quantity')
            .in('cart_id', generatedCartIdsForCheck);
        assertNoError(itemsError);

        expect(items).toHaveLength(30);
        expect(
            generatedCarts.every(({ user_id }) =>
                new Set(existingUsers.map(({ id }) => id)).has(user_id),
            ),
        ).toBe(true);
        expect(
            items?.every(
                ({ book_id, quantity }) =>
                    existingBooks.some(({ id }) => id === book_id) && quantity === 1,
            ),
        ).toBe(true);

        const { data: fixture, error: fixtureError } = await admin
            .from('shopping_cart_items')
            .select('id, cart_id, book_id, quantity')
            .eq('id', fixtureCartItemId)
            .single();
        assertNoError(fixtureError);
        expect(fixture).toEqual({
            id: fixtureCartItemId,
            cart_id: fixtureCartId,
            book_id: bookIds[0],
            quantity: 1,
        });
    });
});
