import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { addSales } from '@/app/dev-tools/actions/DevToolsService';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    let uuidIndex = 0;
    let paymentIntentIndex = 0;

    return {
        faker: {
            helpers: {
                arrayElement: jest.fn((values: Array<Record<string, unknown> | string>) => {
                    if (typeof values[0] === 'string' && values.includes('cancelled'))
                        return 'cancelled';

                    if (typeof values[0] === 'object' && 'title' in values[0]) {
                        const testBooks = values.filter(
                            (book) =>
                                typeof book !== 'string' &&
                                typeof book.title === 'string' &&
                                book.title.startsWith(
                                    process.env.DEV_TOOLS_ORDER_TEST_BOOK_PREFIX ?? '',
                                ),
                        );
                        return testBooks[0] ?? values[0];
                    }

                    if (
                        typeof values[0] === 'object' &&
                        values[0] !== null &&
                        Object.keys(values[0]).length === 1 &&
                        'id' in values[0]
                    ) {
                        const testUsers = values.filter(
                            (user) =>
                                typeof user !== 'string' &&
                                user.id === process.env.DEV_TOOLS_ORDER_TEST_USER_ID,
                        );
                        return testUsers[0] ?? values[0];
                    }

                    return values[0];
                }),
            },
            number: { int: jest.fn(() => 1) },
            string: {
                uuid: jest.fn(() => {
                    const uuidPrefix = process.env.DEV_TOOLS_ORDER_TEST_UUID_PREFIX;
                    if (!uuidPrefix)
                        throw new Error('Order integration UUID prefix is not configured.');
                    const value = (uuidIndex++).toString(16).padStart(12, '0');
                    return `${uuidPrefix.slice(0, 8)}-${uuidPrefix.slice(8, 12)}-4000-8000-${value}`;
                }),
                alphanumeric: jest.fn(
                    () => `${process.env.DEV_TOOLS_ORDER_TEST_PREFIX}_${paymentIntentIndex++}`,
                ),
            },
            date: { recent: jest.fn(() => new Date('2026-01-01T00:00:00.000Z')) },
        },
    };
});

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationServiceKey);
const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Dev-tools order generation integration', () => {
    let admin: SupabaseClient<Database>;
    const testPrefix = `OTEST${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const uuidPrefix = randomUUID().replaceAll('-', '');
    const paymentIntentPrefix = `pi_${testPrefix}_`;
    const userId = randomUUID();
    const username = `${testPrefix}_user`;
    const email = `${username}@example.test`;
    const bookId = randomUUID();
    const bookTitle = `${testPrefix} Book`;
    const createdAuthUserIds: string[] = [];

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const fetchGeneratedOrders = async () => {
        const { data, error } = await admin
            .from('orders')
            .select('id, user_id, status, stripe_payment_intent_id')
            .like('stripe_payment_intent_id', `${paymentIntentPrefix}%`);
        assertNoError(error);
        if (!data) throw new Error('Generated order lookup returned no data.');
        return data;
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        process.env.DEV_TOOLS_ORDER_TEST_UUID_PREFIX = uuidPrefix;
        process.env.DEV_TOOLS_ORDER_TEST_PREFIX = testPrefix;
        process.env.DEV_TOOLS_ORDER_TEST_BOOK_PREFIX = testPrefix;
        process.env.DEV_TOOLS_ORDER_TEST_USER_ID = userId;

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
            first_name: 'Order',
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

        const { error: bookError } = await admin.from('books').insert({
            id: bookId,
            title: bookTitle,
            author: 'Order Integration Test',
            genre: 'Integration',
            publisher: 'Dev Tools Tests',
            publication_date: '2020-01-01',
            price: '10.00',
            description: 'Order integration test fixture.',
            format: 'Paperback',
            page_count: 100,
            image_url: '',
            stock_quantity: 1,
            is_active: true,
        });
        assertNoError(bookError);
    });

    afterAll(async () => {
        if (!admin) return;

        try {
            const generatedOrders = await fetchGeneratedOrders();
            const orderIds = generatedOrders.map(({ id }) => id);

            if (orderIds.length > 0) {
                const { error: discountsError } = await admin
                    .from('order_discounts')
                    .delete()
                    .in('order_id', orderIds);
                assertNoError(discountsError);

                const { error: itemsError } = await admin
                    .from('order_items')
                    .delete()
                    .in('order_id', orderIds);
                assertNoError(itemsError);

                const { error: ordersError } = await admin
                    .from('orders')
                    .delete()
                    .in('id', orderIds);
                assertNoError(ordersError);
            }

            const { error: bookError } = await admin.from('books').delete().eq('id', bookId);
            assertNoError(bookError);

            const { error: profileError } = await admin.from('users').delete().eq('id', userId);
            assertNoError(profileError);

            for (const authUserId of createdAuthUserIds) {
                const { error } = await admin.auth.admin.deleteUser(authUserId);
                assertNoError(error);
            }

            const [
                remainingOrders,
                remainingItems,
                remainingDiscounts,
                remainingBook,
                remainingUser,
            ] = await Promise.all([
                admin
                    .from('orders')
                    .select('id')
                    .like('stripe_payment_intent_id', `${paymentIntentPrefix}%`),
                orderIds.length
                    ? admin.from('order_items').select('id').in('order_id', orderIds)
                    : Promise.resolve({ data: [], error: null }),
                orderIds.length
                    ? admin.from('order_discounts').select('id').in('order_id', orderIds)
                    : Promise.resolve({ data: [], error: null }),
                admin.from('books').select('id').eq('id', bookId),
                admin.from('users').select('id').eq('id', userId),
            ]);
            assertNoError(remainingOrders.error);
            assertNoError(remainingItems.error);
            assertNoError(remainingDiscounts.error);
            assertNoError(remainingBook.error);
            assertNoError(remainingUser.error);
            if (
                remainingOrders.data?.length ||
                remainingItems.data?.length ||
                remainingDiscounts.data?.length ||
                remainingBook.data?.length ||
                remainingUser.data?.length
            )
                throw new Error('Order integration test cleanup left fixture rows behind.');
        } finally {
            createdAuthUserIds.length = 0;
            delete process.env.DEV_TOOLS_ORDER_TEST_UUID_PREFIX;
            delete process.env.DEV_TOOLS_ORDER_TEST_PREFIX;
            delete process.env.DEV_TOOLS_ORDER_TEST_BOOK_PREFIX;
            delete process.env.DEV_TOOLS_ORDER_TEST_USER_ID;
        }
    });

    it('adds complete order batches on repeat runs using only its test fixtures', async () => {
        const authorizeWrite = async () => {};
        const firstResult = await addSales(admin, authorizeWrite);
        expect(firstResult).toEqual({ message: 'Success: 10 Orders injected.', success: true });
        const firstRunOrders = await fetchGeneratedOrders();
        expect(firstRunOrders).toHaveLength(10);

        const secondResult = await addSales(admin, authorizeWrite);
        expect(secondResult).toEqual({ message: 'Success: 10 Orders injected.', success: true });
        const orders = await fetchGeneratedOrders();
        const firstRunIds = new Set(firstRunOrders.map(({ id }) => id));
        const secondRunOrders = orders.filter(({ id }) => !firstRunIds.has(id));

        expect(orders).toHaveLength(20);
        expect(secondRunOrders).toHaveLength(10);
        expect(new Set(orders.map(({ id }) => id)).size).toBe(20);
        expect(
            orders.every(({ user_id, status }) => user_id === userId && status === 'cancelled'),
        ).toBe(true);

        const orderIds = orders.map(({ id }) => id);
        const { data: items, error: itemsError } = await admin
            .from('order_items')
            .select('order_id, book_id, quantity')
            .in('order_id', orderIds);
        assertNoError(itemsError);
        expect(items).toHaveLength(20);
        expect(items?.every(({ book_id }) => book_id === bookId)).toBe(true);
    });
});
