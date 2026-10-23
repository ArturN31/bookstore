import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database, Json } from '@/database.types';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationAnonKey = process.env.SUPABASE_INTEGRATION_ANON_KEY;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationAnonKey && integrationServiceKey);

const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Checkout discount redemption integration', () => {
    let admin: SupabaseClient<Database>;
    const firstUserId = randomUUID();
    const secondUserId = randomUUID();
    const bookId = randomUUID();
    const usernamePrefix = randomUUID().replaceAll('-', '').slice(0, 12);
    const userIds = [firstUserId, secondUserId];
    const emails = userIds.map((id) => `discount_${id}@example.test`);
    const discountIds = [
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
        randomUUID(),
    ];
    const extraDiscountIds: string[] = [];
    const paymentIntentIds = Array.from({ length: 20 }, () => `pi_discount_${randomUUID()}`);
    const createdAuthUserIds: string[] = [];
    let paymentIntentIndex = 0;

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    const getOrderId = (result: Json | null) => {
        if (
            !result ||
            typeof result !== 'object' ||
            Array.isArray(result) ||
            typeof result.order_id !== 'string'
        )
            throw new Error('Checkout result did not include an order ID.');

        return result.order_id;
    };

    const insertUser = async (userId: string, email: string, index: number) => {
        const { error: authError } = await admin.auth.admin.createUser({
            id: userId,
            email,
            password: randomUUID(),
            email_confirm: true,
        });
        assertNoError(authError);
        createdAuthUserIds.push(userId);

        const { error } = await admin.from('users').insert({
            id: userId,
            first_name: 'Discount',
            last_name: 'Test',
            date_of_birth: '2000-01-01',
            street_address: '1 Test Street',
            postcode: '00000',
            city: 'Test City',
            country: 'Test Country',
            phone_number: '0000000000',
            username: `discount_${usernamePrefix}_${index}`,
        });
        assertNoError(error);
    };

    const insertDiscount = async (
        discountId: string,
        code: string,
        overrides: Partial<Database['public']['Tables']['discounts']['Insert']> = {},
    ) => {
        const now = Date.now();
        const { error } = await admin.from('discounts').insert({
            id: discountId,
            code,
            type: 'percentage',
            value: 10,
            is_active: true,
            start_date: new Date(now - 60_000).toISOString(),
            end_date: new Date(now + 3_600_000).toISOString(),
            minimum_subtotal: 10,
            usage_limit: null,
            times_used: 0,
            uses_per_user: null,
            ...overrides,
        });
        assertNoError(error);
    };

    const createOrder = async (userId: string, discountId: string) => {
        const paymentIntentId = paymentIntentIds[paymentIntentIndex++];
        const payload = {
            user_id: userId,
            subtotal: 20,
            discount_amount: 2,
            shipping_cost: 0,
            tax_amount: 0,
            total_amount: 18,
            shipping_method_id: 'test',
            shipping_method_name: 'Test',
            payment_method: 'card',
            discount_id: discountId,
            payment_intent_id: paymentIntentId,
            shipping_address: null,
            items: [{ book_id: bookId, quantity: 1, price: 20 }],
        } satisfies Json;

        return {
            paymentIntentId,
            result: await admin.rpc('process_order_transaction', { p_payload: payload }),
        };
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationAnonKey || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);
        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        await insertUser(firstUserId, emails[0], 1);
        await insertUser(secondUserId, emails[1], 2);

        const { error: bookError } = await admin.from('books').insert({
            id: bookId,
            title: 'Discount Integration Test Book',
            author: 'Test Author',
            genre: 'Test',
            publisher: 'Test Publisher',
            publication_date: '2020-01-01',
            price: '20.00',
            description: 'Discount integration test fixture',
            format: 'Paperback',
            page_count: 100,
            image_url: '',
            stock_quantity: 100,
            is_active: true,
        });
        assertNoError(bookError);

        await insertDiscount(discountIds[0], `GLOBAL_${usernamePrefix}`, { usage_limit: 1 });
        await insertDiscount(discountIds[1], `PER_USER_${usernamePrefix}`, { uses_per_user: 1 });
        await insertDiscount(discountIds[2], `EXPIRED_${usernamePrefix}`, {
            end_date: new Date(Date.now() - 60_000).toISOString(),
        });
        await insertDiscount(discountIds[3], `MINIMUM_${usernamePrefix}`, {
            minimum_subtotal: 100,
        });
        await insertDiscount(discountIds[4], `INACTIVE_${usernamePrefix}`, { is_active: false });
        await insertDiscount(discountIds[5], `FUTURE_${usernamePrefix}`, {
            start_date: new Date(Date.now() + 3_600_000).toISOString(),
        });
    });

    afterAll(async () => {
        if (!admin) return;

        const { error: orderError } = await admin
            .from('orders')
            .update({ status: 'failed' })
            .in('stripe_payment_intent_id', paymentIntentIds)
            .eq('status', 'pending');
        assertNoError(orderError);

        const { error: deleteOrdersError } = await admin
            .from('orders')
            .delete()
            .in('stripe_payment_intent_id', paymentIntentIds);
        assertNoError(deleteOrdersError);

        const { error: discountsError } = await admin
            .from('discounts')
            .delete()
            .in('id', [...discountIds, ...extraDiscountIds]);
        assertNoError(discountsError);

        const { error: bookError } = await admin.from('books').delete().eq('id', bookId);
        assertNoError(bookError);

        for (const userId of createdAuthUserIds) {
            const { error: profileError } = await admin.from('users').delete().eq('id', userId);
            assertNoError(profileError);
            const { error: authError } = await admin.auth.admin.deleteUser(userId);
            assertNoError(authError);
        }
    });

    it('rejects inactive, not-yet-active, expired, and below-minimum discounts at order creation', async () => {
        const inactive = await createOrder(firstUserId, discountIds[4]);
        expect(inactive.result.error?.message).toContain('DISCOUNT_NOT_ACTIVE');

        const notYetActive = await createOrder(firstUserId, discountIds[5]);
        expect(notYetActive.result.error?.message).toContain('DISCOUNT_NOT_ACTIVE');

        const expired = await createOrder(firstUserId, discountIds[2]);
        expect(expired.result.error?.message).toContain('EXPIRED_DISCOUNT_CODE');

        const belowMinimum = await createOrder(firstUserId, discountIds[3]);
        expect(belowMinimum.result.error?.message).toContain(
            'DISCOUNT_MINIMUM_SUBTOTAL_NOT_MET',
        );

        const rejectedPaymentIntentIds = [
            inactive.paymentIntentId,
            notYetActive.paymentIntentId,
            expired.paymentIntentId,
            belowMinimum.paymentIntentId,
        ];
        const { data: rejectedOrders, error: rejectedOrdersError } = await admin
            .from('orders')
            .select('id')
            .in('stripe_payment_intent_id', rejectedPaymentIntentIds);
        assertNoError(rejectedOrdersError);
        expect(rejectedOrders).toHaveLength(0);

        const { data: unchangedBook, error: bookReadError } = await admin
            .from('books')
            .select('stock_quantity')
            .eq('id', bookId)
            .single();
        assertNoError(bookReadError);
        expect(unchangedBook?.stock_quantity).toBe(100);
    });

    it('reserves global and per-user limits atomically and releases failed orders', async () => {
        const globalFirst = await createOrder(firstUserId, discountIds[0]);
        expect(globalFirst.result.error).toBeNull();
        if (!globalFirst.result.data) throw new Error('First checkout order was not created.');
        const globalFirstOrderId = getOrderId(globalFirst.result.data);
        const { data: reservedDiscount, error: reservedDiscountError } = await admin
            .from('discounts')
            .select('times_used')
            .eq('id', discountIds[0])
            .single();
        assertNoError(reservedDiscountError);
        if (!reservedDiscount) throw new Error('Reserved discount fixture was not found.');
        expect(reservedDiscount.times_used).toBe(1);
        const { data: reservationRow, error: reservationRowError } = await admin
            .from('order_discounts')
            .select('usage_counted')
            .eq('order_id', globalFirstOrderId)
            .single();
        assertNoError(reservationRowError);
        expect(reservationRow?.usage_counted).toBe(true);

        const duplicate = await admin.from('order_discounts').insert({
            order_id: globalFirstOrderId,
            discount_id: discountIds[0],
        });
        expect(duplicate.error?.message).toContain('DISCOUNT_ALREADY_APPLIED');

        const globalSecond = await createOrder(secondUserId, discountIds[0]);
        expect(globalSecond.result.error?.message).toContain('DISCOUNT_USAGE_LIMIT_REACHED');

        const { error: failFirstOrderError } = await admin
            .from('orders')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', globalFirst.paymentIntentId);
        assertNoError(failFirstOrderError);

        const { data: releasedDiscount, error: releasedDiscountError } = await admin
            .from('discounts')
            .select('times_used')
            .eq('id', discountIds[0])
            .single();
        assertNoError(releasedDiscountError);
        if (!releasedDiscount) throw new Error('Released discount fixture was not found.');
        expect(releasedDiscount.times_used).toBe(0);
        const { data: releasedRow, error: releasedRowError } = await admin
            .from('order_discounts')
            .select('usage_counted')
            .eq('order_id', globalFirstOrderId)
            .single();
        assertNoError(releasedRowError);
        expect(releasedRow?.usage_counted).toBe(false);

        const afterRelease = await createOrder(secondUserId, discountIds[0]);
        expect(afterRelease.result.error).toBeNull();

        const { error: cancelOrderError } = await admin
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('stripe_payment_intent_id', afterRelease.paymentIntentId);
        assertNoError(cancelOrderError);

        const { data: cancelledDiscount, error: cancelledDiscountError } = await admin
            .from('discounts')
            .select('times_used')
            .eq('id', discountIds[0])
            .single();
        assertNoError(cancelledDiscountError);
        if (!cancelledDiscount) throw new Error('Cancelled discount fixture was not found.');
        expect(cancelledDiscount.times_used).toBe(0);

        const deleteReleaseOrder = await createOrder(firstUserId, discountIds[0]);
        expect(deleteReleaseOrder.result.error).toBeNull();
        if (!deleteReleaseOrder.result.data)
            throw new Error('Order for deletion-release test was not created.');
        const deleteReleaseOrderId = getOrderId(deleteReleaseOrder.result.data);
        const { error: deleteDiscountLinkError } = await admin
            .from('order_discounts')
            .delete()
            .eq('order_id', deleteReleaseOrderId);
        assertNoError(deleteDiscountLinkError);
        const { data: deletedLinkDiscount, error: deletedLinkDiscountError } = await admin
            .from('discounts')
            .select('times_used')
            .eq('id', discountIds[0])
            .single();
        assertNoError(deletedLinkDiscountError);
        if (!deletedLinkDiscount) throw new Error('Deleted-link discount fixture was not found.');
        expect(deletedLinkDiscount.times_used).toBe(0);

        const perUserFirst = await createOrder(firstUserId, discountIds[1]);
        expect(perUserFirst.result.error).toBeNull();

        const perUserSecond = await createOrder(firstUserId, discountIds[1]);
        expect(perUserSecond.result.error?.message).toContain('DISCOUNT_USER_LIMIT_REACHED');
    });

    it('allows cancelled seed orders to retain discount links without validation or usage accounting', async () => {
        const paymentIntentId = paymentIntentIds[paymentIntentIndex++];
        const { data: order, error: orderError } = await admin
            .from('orders')
            .insert({
                user_id: firstUserId,
                subtotal: 20,
                discount_amount: 2,
                shipping_cost: 0,
                tax_amount: 0,
                total_amount: 18,
                shipping_method_id: 'test',
                shipping_method_name: 'Test',
                payment_method: 'card',
                status: 'cancelled',
                stripe_payment_intent_id: paymentIntentId,
            })
            .select('id')
            .single();
        assertNoError(orderError);
        if (!order) throw new Error('Cancelled seed order fixture was not created.');

        const { error: linkError } = await admin.from('order_discounts').insert({
            order_id: order.id,
            discount_id: discountIds[2],
        });
        assertNoError(linkError);

        const { data: expiredDiscount, error: expiredDiscountError } = await admin
            .from('discounts')
            .select('times_used')
            .eq('id', discountIds[2])
            .single();
        assertNoError(expiredDiscountError);
        if (!expiredDiscount) throw new Error('Expired discount fixture was not found.');
        expect(expiredDiscount.times_used).toBe(0);
    });

    it('allows only one concurrent order to reserve the final global use', async () => {
        const discountId = randomUUID();
        extraDiscountIds.push(discountId);
        await insertDiscount(discountId, `RACE_${usernamePrefix}`, { usage_limit: 1 });

        const results = await Promise.all([
            createOrder(firstUserId, discountId),
            createOrder(secondUserId, discountId),
        ]);
        const successful = results.filter(({ result }) => !result.error);
        const rejected = results.filter(({ result }) => result.error);

        expect(successful).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect(rejected[0].result.error?.message).toContain('DISCOUNT_USAGE_LIMIT_REACHED');

        const { error: orderError } = await admin
            .from('orders')
            .update({ status: 'failed' })
            .in(
                'stripe_payment_intent_id',
                results.map(({ paymentIntentId }) => paymentIntentId),
            )
            .eq('status', 'pending');
        assertNoError(orderError);

    });
});
