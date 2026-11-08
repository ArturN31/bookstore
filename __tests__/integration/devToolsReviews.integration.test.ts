import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { naturalPairKey } from '@/utils/db/dbSeed/candidatePlanning';
import { reviewBomb } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    let idIndex = 0;

    return {
        faker: {
            date: { past: jest.fn(() => new Date('2026-01-01T00:00:00.000Z')) },
            string: {
                uuid: jest.fn(
                    () => `00000000-0000-4000-8000-${(idIndex++).toString(16).padStart(12, '0')}`,
                ),
            },
            lorem: {
                paragraph: jest.fn(
                    () => `Generated review ${process.env.DEV_TOOLS_REVIEW_TEST_PREFIX}`,
                ),
            },
        },
    };
});

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools review generation integration', () => {
    let admin: SupabaseClient<Database>;
    const testPrefix = `RTEST${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const generatedReviewText = `Generated review ${testPrefix}`;
    const userIds = [randomUUID(), randomUUID()];
    const usernames = [`${testPrefix}_user_1`, `${testPrefix}_user_2`];
    const emails = userIds.map((id) => `review_${id}@example.test`);
    const bookIds = Array.from({ length: 51 }, () => randomUUID());
    const fixtureReviewId = randomUUID();
    const fixtureReviewText = `Pre-existing review ${testPrefix}`;
    const createdAuthUserIds: string[] = [];

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchGeneratedReviews = async () => {
        const { data, error } = await admin
            .from('book_reviews')
            .select('id, user_id, book_id, review')
            .eq('review', generatedReviewText);
        assertNoError(error);
        if (!data) throw new Error('Review lookup returned no data.');
        return data;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        process.env.DEV_TOOLS_REVIEW_TEST_PREFIX = testPrefix;

        for (let index = 0; index < userIds.length; index += 1) {
            const userId = userIds[index];
            const { error } = await admin.auth.admin.createUser({
                id: userId,
                email: emails[index],
                password: randomUUID(),
                email_confirm: true,
                user_metadata: { username: usernames[index] },
            });
            assertNoError(error);
            createdAuthUserIds.push(userId);
        }

        const { error: profilesError } = await admin.from('users').insert(
            userIds.map((id, index) => ({
                id,
                first_name: 'Review',
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
                author: 'Review Integration Test',
                genre: 'Integration',
                publisher: 'Dev Tools Tests',
                publication_date: '2020-01-01',
                price: '10.00',
                description: 'Review integration test fixture.',
                format: 'Paperback',
                page_count: 100,
                image_url: '',
                stock_quantity: 1,
                is_active: true,
            })),
        );
        assertNoError(booksError);

        const { error: reviewError } = await admin.from('book_reviews').insert({
            id: fixtureReviewId,
            user_id: userIds[0],
            book_id: bookIds[0],
            username: usernames[0],
            rating: 5,
            review: fixtureReviewText,
        });
        assertNoError(reviewError);
    });

    afterAll(async () => {
        if (!admin) return;

        try {
            const [generatedCleanup, fixtureCleanup] = await Promise.all([
                admin.from('book_reviews').delete().eq('review', generatedReviewText),
                admin.from('book_reviews').delete().eq('id', fixtureReviewId),
            ]);
            assertNoError(generatedCleanup.error);
            assertNoError(fixtureCleanup.error);

            const [booksCleanup, profilesCleanup] = await Promise.all([
                admin.from('books').delete().in('id', bookIds),
                admin.from('users').delete().in('id', userIds),
            ]);
            assertNoError(booksCleanup.error);
            assertNoError(profilesCleanup.error);

            for (const userId of createdAuthUserIds) {
                const { error } = await admin.auth.admin.deleteUser(userId);
                assertNoError(error);
            }

            const [remainingGenerated, remainingFixture, remainingBooks, remainingProfiles] =
                await Promise.all([
                    admin.from('book_reviews').select('id').eq('review', generatedReviewText),
                    admin.from('book_reviews').select('id').eq('id', fixtureReviewId),
                    admin.from('books').select('id').in('id', bookIds),
                    admin.from('users').select('id').in('id', userIds),
                ]);
            assertNoError(remainingGenerated.error);
            assertNoError(remainingFixture.error);
            assertNoError(remainingBooks.error);
            assertNoError(remainingProfiles.error);
            if (
                remainingGenerated.data?.length ||
                remainingFixture.data?.length ||
                remainingBooks.data?.length ||
                remainingProfiles.data?.length
            )
                throw new Error('Review integration test cleanup left fixture rows behind.');
        } finally {
            delete process.env.DEV_TOOLS_REVIEW_TEST_PREFIX;
        }
    });

    it('adds exact unique review batches on repeat runs and preserves an existing review', async () => {
        const authorizeWrite = async () => {};
        const firstResult = await reviewBomb(admin, authorizeWrite);
        expect(firstResult).toEqual({
            success: true,
            message: expect.stringContaining('Social Proof: 50 reviews distributed among '),
        });
        expect(firstResult.message).toContain(' profiles.');

        const firstRunReviews = await fetchGeneratedReviews();
        expect(firstRunReviews).toHaveLength(50);

        const secondResult = await reviewBomb(admin, authorizeWrite);
        expect(secondResult).toEqual({
            success: true,
            message: expect.stringContaining('Social Proof: 50 reviews distributed among '),
        });
        expect(secondResult.message).toContain(' profiles.');

        const generatedReviews = await fetchGeneratedReviews();
        const firstRunIds = new Set(firstRunReviews.map(({ id }) => id));
        const secondRunReviews = generatedReviews.filter(({ id }) => !firstRunIds.has(id));
        const naturalKeys = generatedReviews.map(({ user_id, book_id }) =>
            naturalPairKey(user_id, book_id),
        );

        expect(generatedReviews).toHaveLength(100);
        expect(secondRunReviews).toHaveLength(50);
        expect(new Set(naturalKeys).size).toBe(100);

        const { data: fixture, error } = await admin
            .from('book_reviews')
            .select('id, user_id, book_id, review')
            .eq('id', fixtureReviewId)
            .single();
        assertNoError(error);
        expect(fixture).toEqual({
            id: fixtureReviewId,
            user_id: userIds[0],
            book_id: bookIds[0],
            review: fixtureReviewText,
        });
    });
});
