import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { naturalPairKey } from '@/utils/db/dbSeed/candidatePlanning';
import { addBooks } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    let titleIndex = 0;
    let idIndex = 0;
    const fixedDate = new Date('2026-01-01T00:00:00.000Z');

    return {
        faker: {
            book: {
                title: jest.fn(() => {
                    const index = titleIndex++;
                    const candidateIndex = index >= 500 && index < 550 ? index - 500 : index;
                    return `${process.env.DEV_TOOLS_BOOK_TEST_PREFIX} Candidate ${candidateIndex}`;
                }),
                author: jest.fn(() => 'Dev Tools Integration Author'),
                genre: jest.fn(() => 'Integration'),
                publisher: jest.fn(() => 'Dev Tools Tests'),
                format: jest.fn(() => 'Paperback'),
            },
            color: { rgb: jest.fn(() => 'ffffff') },
            string: {
                uuid: jest.fn(() => {
                    const prefix = process.env.DEV_TOOLS_BOOK_TEST_PREFIX;
                    if (!prefix) throw new Error('Book integration test prefix is not configured.');
                    return `${prefix.slice(0, 24)}${(idIndex++).toString(16).padStart(12, '0')}`;
                }),
            },
            date: {
                past: jest.fn(() => fixedDate),
                between: jest.fn(() => fixedDate),
            },
            commerce: { price: jest.fn(() => '10.00') },
            lorem: { paragraph: jest.fn(() => 'Generated integration test book.') },
            number: { int: jest.fn(() => 100) },
        },
    };
});

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools book generation integration', () => {
    let admin: SupabaseClient<Database>;
    const fixtureId = randomUUID();
    const fixtureTitle = `Dev Tools Integration Fixture ${randomUUID()}`;
    const fixtureAuthor = 'Dev Tools Integration Test';
    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchGeneratedBooks = async () => {
        const { data, error } = await admin
            .from('books')
            .select('id, title, author')
            .like('title', `${fixtureId} Candidate%`);
        assertNoError(error);
        if (!data) throw new Error('Book lookup returned no data.');
        return data;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        process.env.DEV_TOOLS_BOOK_TEST_PREFIX = fixtureId;

        const { error } = await admin.from('books').insert({
            id: fixtureId,
            title: fixtureTitle,
            author: fixtureAuthor,
            genre: 'Integration',
            publisher: 'Dev Tools Tests',
            publication_date: '2020-01-01',
            price: '10.00',
            description: 'Pre-existing book fixture for additive generation.',
            format: 'Paperback',
            page_count: 100,
            image_url: '',
            stock_quantity: 1,
            is_active: true,
        });
        assertNoError(error);
    });

    afterAll(async () => {
        if (!admin) return;

        try {
            const [generatedCleanup, fixtureCleanup] = await Promise.all([
                admin.from('books').delete().like('title', `${fixtureId} Candidate%`),
                admin.from('books').delete().eq('id', fixtureId),
            ]);
            const generatedBooksError = generatedCleanup.error;
            assertNoError(generatedBooksError);
            assertNoError(fixtureCleanup.error);

            const [remainingGenerated, remainingFixture] = await Promise.all([
                admin.from('books').select('id').like('title', `${fixtureId} Candidate%`),
                admin.from('books').select('id').eq('id', fixtureId),
            ]);
            assertNoError(remainingGenerated.error);
            assertNoError(remainingFixture.error);
            if (remainingGenerated.data?.length || remainingFixture.data?.length)
                throw new Error('Book integration test cleanup left fixture rows behind.');
        } finally {
            jest.restoreAllMocks();
            delete process.env.DEV_TOOLS_BOOK_TEST_PREFIX;
        }
    });

    it('adds exact unique batches on repeat runs and preserves pre-existing books', async () => {
        const authorizeWrite = async () => {};
        const firstResult = await addBooks(admin, authorizeWrite);
        expect(firstResult).toEqual({ message: 'Success: 50 books inserted.', success: true });

        const firstRunBooks = await fetchGeneratedBooks();
        expect(firstRunBooks).toHaveLength(50);

        const secondResult = await addBooks(admin, authorizeWrite);
        expect(secondResult).toEqual({ message: 'Success: 50 books inserted.', success: true });

        const generatedBooks = await fetchGeneratedBooks();
        const firstRunIds = new Set(firstRunBooks.map(({ id }) => id));
        const secondRunBooks = generatedBooks.filter(({ id }) => !firstRunIds.has(id));
        const generatedKeys = generatedBooks.map(({ title, author }) =>
            naturalPairKey(title, author),
        );

        expect(generatedBooks).toHaveLength(100);
        expect(secondRunBooks).toHaveLength(50);
        expect(new Set(generatedKeys).size).toBe(100);
        const { data: fixture, error: fixtureError } = await admin
            .from('books')
            .select('id, title, author')
            .eq('id', fixtureId)
            .single();
        assertNoError(fixtureError);
        expect(fixture).toEqual({
            id: fixtureId,
            title: fixtureTitle,
            author: fixtureAuthor,
        });
    });
});
