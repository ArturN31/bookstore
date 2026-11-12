import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { normalizeNaturalKey } from '@/utils/db/dbSeed/candidatePlanning';
import { seedDiscounts } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    let suffixIndex = 0;

    return {
        faker: {
            helpers: {
                arrayElement: jest.fn(() => `DEV${process.env.DEV_TOOLS_DISCOUNT_TEST_PREFIX}`),
            },
            string: {
                alphanumeric: jest.fn(() =>
                    (suffixIndex++).toString(36).toUpperCase().padStart(3, '0'),
                ),
            },
            number: { int: jest.fn(() => 10) },
            date: { future: jest.fn(() => new Date('2027-01-01T00:00:00.000Z')) },
        },
    };
});

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools discount generation integration', () => {
    let admin: SupabaseClient<Database>;
    const testPrefix = `DTEST${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const generatedCodePrefix = `DEV${testPrefix}`;
    const fixtureId = randomUUID();
    const fixtureCode = `${testPrefix}_EXISTING`;
    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchGeneratedDiscounts = async () => {
        const { data, error } = await admin
            .from('discounts')
            .select('id, code')
            .like('code', `${generatedCodePrefix}_%`);
        assertNoError(error);
        if (!data) throw new Error('Discount lookup returned no data.');
        return data;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        process.env.DEV_TOOLS_DISCOUNT_TEST_PREFIX = testPrefix;

        const { error } = await admin.from('discounts').insert({
            id: fixtureId,
            code: fixtureCode,
            type: 'percentage',
            value: 10,
            is_active: true,
            start_date: '2026-01-01T00:00:00.000Z',
            end_date: '2027-01-01T00:00:00.000Z',
        });
        assertNoError(error);
    });

    afterAll(async () => {
        if (!admin) return;

        try {
            const [generatedCleanup, fixtureCleanup] = await Promise.all([
                admin.from('discounts').delete().like('code', `${generatedCodePrefix}_%`),
                admin.from('discounts').delete().eq('id', fixtureId),
            ]);
            assertNoError(generatedCleanup.error);
            assertNoError(fixtureCleanup.error);

            const [remainingGenerated, remainingFixture] = await Promise.all([
                admin.from('discounts').select('id').like('code', `${generatedCodePrefix}_%`),
                admin.from('discounts').select('id').eq('id', fixtureId),
            ]);
            assertNoError(remainingGenerated.error);
            assertNoError(remainingFixture.error);
            if (remainingGenerated.data?.length || remainingFixture.data?.length)
                throw new Error('Discount integration test cleanup left fixture rows behind.');
        } finally {
            delete process.env.DEV_TOOLS_DISCOUNT_TEST_PREFIX;
        }
    });

    it('adds exact unique batches on repeat runs and preserves a pre-existing discount', async () => {
        const authorizeWrite = async () => {};
        const firstResult = await seedDiscounts(admin, authorizeWrite);
        expect(firstResult).toEqual({ message: '5 New Discounts Added', success: true });

        const firstRunDiscounts = await fetchGeneratedDiscounts();
        expect(firstRunDiscounts).toHaveLength(5);

        const secondResult = await seedDiscounts(admin, authorizeWrite);
        expect(secondResult).toEqual({ message: '5 New Discounts Added', success: true });

        const generatedDiscounts = await fetchGeneratedDiscounts();
        const firstRunIds = new Set(firstRunDiscounts.map(({ id }) => id));
        const secondRunDiscounts = generatedDiscounts.filter(({ id }) => !firstRunIds.has(id));
        const codes = generatedDiscounts.map(({ code }) => normalizeNaturalKey(code));

        expect(generatedDiscounts).toHaveLength(10);
        expect(secondRunDiscounts).toHaveLength(5);
        expect(new Set(codes).size).toBe(10);

        const { data: fixture, error } = await admin
            .from('discounts')
            .select('id, code')
            .eq('id', fixtureId)
            .single();
        assertNoError(error);
        expect(fixture).toEqual({ id: fixtureId, code: fixtureCode });
    });

    it('rejects concurrent discount codes that differ only by case and surrounding spaces', async () => {
        const code = `${generatedCodePrefix}_RACE`;
        const ids = [randomUUID(), randomUUID()];
        const rows = [code, ` ${code.toLowerCase()} `].map((candidateCode, index) => ({
            id: ids[index],
            code: candidateCode,
            type: 'percentage' as const,
            value: 10,
            is_active: true,
            start_date: '2026-01-01T00:00:00.000Z',
            end_date: '2027-01-01T00:00:00.000Z',
        }));

        try {
            const results = await Promise.all(
                rows.map((row) => admin.from('discounts').insert(row).select('id')),
            );
            const inserted = results.filter((result) => !result.error);
            const rejected = results.filter((result) => result.error);

            expect(inserted).toHaveLength(1);
            expect(rejected).toHaveLength(1);
            expect(rejected[0].error?.code).toBe('23505');

            const { data, error } = await admin.from('discounts').select('id').in('id', ids);
            assertNoError(error);
            expect(data).toHaveLength(1);
        } finally {
            const { error } = await admin.from('discounts').delete().in('id', ids);
            assertNoError(error);
        }
    });
});
