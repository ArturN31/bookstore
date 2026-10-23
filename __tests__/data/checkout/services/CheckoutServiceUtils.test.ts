/**
 * @jest-environment node
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import {
    buildOrderPayload,
    calculateCheckoutTotals,
    calculateRawSubtotal,
    createCheckoutPaymentIntent,
    createCheckoutResult,
    loadCheckoutItems,
    loadDiscountState,
    persistCheckoutOrder,
    recoverCheckoutOrder,
} from '@/data/checkout/services/CheckoutServiceUtils';
import {
    CartCheckoutItem,
    ProcessCheckoutParams,
} from '@/data/checkout/CheckoutTypes';
import { createAdminClient } from '@/utils/db/admin';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import {
    cancelPaymentIntentAction,
    createPaymentIntentAction,
} from '@/data/checkout/CheckoutStripeServer';
import { processOrderTransaction } from '@/data/checkout/repositories/CheckoutOrderRepository';
import { calculateTotals } from '@/data/checkout/CheckoutUtils';

jest.mock('@/utils/db/admin');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/CheckoutStripeServer');
jest.mock('@/data/checkout/repositories/CheckoutOrderRepository');
jest.mock('@/data/checkout/CheckoutUtils');

describe('CheckoutServiceUtils', () => {
    const checkoutParams: ProcessCheckoutParams = {
        userId: 'user-1',
        customerEmail: 'user@example.com',
        stripeCustomerId: 'cus-1',
        items: [{ bookId: 'book-1', quantity: 2 }],
        discountId: 'discount-1',
        paymentMethod: 'card',
        shippingMethodId: 'royal_mail_standard',
        idempotencyKey: 'checkout-key',
        shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            streetAddress: '1 Test Street',
            city: 'Glasgow',
            postcode: 'G1 1AA',
            country: 'United Kingdom',
            phoneNumber: '01234567890',
        },
    };

    const book = {
        id: 'book-1',
        price: '20.00',
        is_active: true,
        stock_quantity: 10,
    };

    let supabase: SupabaseClient<Database>;
    let admin: SupabaseClient<Database>;
    let booksQuery: jest.Mock;
    let discountQuery: jest.Mock;
    let orderLookup: jest.Mock;

    const makeSupabase = (booksResult: unknown, discountResult?: unknown) => {
        booksQuery = jest.fn().mockResolvedValue(booksResult);
        discountQuery = jest.fn().mockResolvedValue(discountResult);

        const from = jest.fn((table: string) => ({
            select: jest.fn(() => ({
                in: booksQuery,
                eq: jest.fn(() => ({ maybeSingle: discountQuery })),
            })),
        }));

        return { from } as unknown as SupabaseClient<Database>;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(safeSupabaseQuery).mockImplementation(async (query) => (await query()) as never);
        jest.mocked(withRetry).mockImplementation(async (query) => (await query()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((error: unknown) =>
            typeof error === 'string' ? error : 'Sanitized error',
        );
        jest.mocked(calculateTotals).mockReturnValue({
            subtotal: 40,
            discountAmount: 4,
            shippingCost: 5.99,
            taxAmount: 0,
            grandTotal: 41.99,
        });
        jest.mocked(createPaymentIntentAction).mockResolvedValue({
            success: true,
            clientSecret: 'pi_secret',
            paymentIntentId: 'pi-1',
            error: null,
        });
        jest.mocked(cancelPaymentIntentAction).mockResolvedValue({ success: true, error: null });
        jest.mocked(processOrderTransaction).mockResolvedValue({
            data: { order_id: 'order-1' },
            error: null,
        } as never);

        orderLookup = jest.fn().mockResolvedValue({ data: null, error: null });
        const maybeSingle = orderLookup;
        const eq = jest.fn(() => ({ maybeSingle }));
        const select = jest.fn(() => ({ eq }));
        admin = {
            from: jest.fn(() => ({ select })),
        } as unknown as SupabaseClient<Database>;
        jest.mocked(createAdminClient).mockResolvedValue(admin);
    });

    describe('loadCheckoutItems', () => {
        it('rejects an empty cart without querying books', async () => {
            supabase = makeSupabase({ data: [book], error: null });

            const result = await loadCheckoutItems(supabase, { ...checkoutParams, items: [] });

            expect(result).toEqual({ data: null, error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT });
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('maps current book prices into checkout and order items', async () => {
            supabase = makeSupabase({ data: [book], error: null });

            const result = await loadCheckoutItems(supabase, checkoutParams);

            expect(result.error).toBeNull();
            expect(result.data?.processItems).toEqual([
                { book_id: 'book-1', quantity: 2, price: 20 },
            ]);
            expect(result.data?.cartItems[0]).toMatchObject({
                id: 'book-1',
                quantity: 2,
            });
            expect(booksQuery).toHaveBeenCalledWith('id', ['book-1']);
        });

        it.each([
            ['query error', { data: null, error: { message: 'database error' } }],
            ['missing book', { data: [], error: null }],
            ['inactive book', { data: [{ ...book, is_active: false }], error: null }],
            ['insufficient stock', { data: [{ ...book, stock_quantity: 1 }], error: null }],
        ])('rejects checkout items for %s', async (_scenario, queryResult) => {
            supabase = makeSupabase(queryResult);

            const result = await loadCheckoutItems(supabase, checkoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe(
                _scenario === 'query error'
                    ? 'Sanitized error'
                    : APP_ERROR_MESSAGES.INSUFFICIENT_STOCK,
            );
        });
    });

    describe('loadDiscountState', () => {
        it('does not query discounts when no discount is selected', async () => {
            supabase = makeSupabase({ data: [book], error: null });

            await expect(loadDiscountState(supabase, null, 40)).resolves.toEqual({
                data: null,
                error: null,
            });
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('maps an active percentage discount', async () => {
            supabase = makeSupabase(
                { data: [book], error: null },
                {
                    data: {
                        id: 'discount-1',
                        code: 'SAVE10',
                        type: 'percentage',
                        value: 10,
                        is_active: true,
                        minimum_subtotal: 20,
                    },
                    error: null,
                },
            );

            const result = await loadDiscountState(supabase, 'discount-1', 40);

            expect(result).toEqual({
                data: {
                    id: 'discount-1',
                    code: 'SAVE10',
                    discountPercent: 10,
                    discountAmount: 0,
                    minimumSubtotal: 20,
                },
                error: null,
            });
            expect(discountQuery).toHaveBeenCalled();
        });

        it('returns the no-data error if the query helper yields no discount without an error', async () => {
            supabase = makeSupabase({ data: [book], error: null });
            jest.mocked(safeSupabaseQuery).mockResolvedValueOnce({
                data: null,
                error: null,
            } as never);

            await expect(loadDiscountState(supabase, 'missing-discount', 40)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            });
        });

        it('does not apply inactive discounts and rejects a missed minimum spend', async () => {
            supabase = makeSupabase(
                { data: [book], error: null },
                {
                    data: {
                        id: 'discount-1',
                        code: 'SAVE10',
                        type: 'fixed_amount',
                        value: 5,
                        is_active: false,
                        minimum_subtotal: null,
                    },
                    error: null,
                },
            );
            await expect(loadDiscountState(supabase, 'discount-1', 40)).resolves.toEqual({
                data: null,
                error: null,
            });

            supabase = makeSupabase(
                { data: [book], error: null },
                {
                    data: {
                        id: 'discount-1',
                        code: 'SAVE10',
                        type: 'fixed_amount',
                        value: 5,
                        is_active: true,
                        minimum_subtotal: 50,
                    },
                    error: null,
                },
            );
            await expect(loadDiscountState(supabase, 'discount-1', 40)).resolves.toEqual({
                data: null,
                error: 'This discount requires a minimum subtotal of £50.00.',
            });
        });

        it('maps fixed discounts without a minimum and reports database lookup errors', async () => {
            supabase = makeSupabase(
                { data: [book], error: null },
                {
                    data: {
                        id: 'discount-1',
                        code: 'SAVE5',
                        type: 'fixed_amount',
                        value: 5,
                        is_active: true,
                        minimum_subtotal: null,
                    },
                    error: null,
                },
            );
            await expect(loadDiscountState(supabase, 'discount-1', 40)).resolves.toEqual({
                data: {
                    id: 'discount-1',
                    code: 'SAVE5',
                    discountPercent: 0,
                    discountAmount: 5,
                    minimumSubtotal: null,
                },
                error: null,
            });

            supabase = makeSupabase(
                { data: [book], error: null },
                { data: null, error: { message: 'discount query failed' } },
            );
            await expect(loadDiscountState(supabase, 'discount-1', 40)).resolves.toEqual({
                data: null,
                error: 'Sanitized error',
            });
        });
    });

    describe('checkout payload and payment helpers', () => {
        it('calculates the raw subtotal from current book prices and quantities', () => {
            expect(
                calculateRawSubtotal([
                    { ...book, quantity: 2 },
                    { ...book, id: 'book-2', price: '5.50', quantity: 1 },
                ] as unknown as CartCheckoutItem[]),
            ).toBe(45.5);
        });

        it('calculates totals with the requested shipping option and falls back for an unknown option', () => {
            const cartItems = [{ ...book, quantity: 2 }] as unknown as CartCheckoutItem[];

            const selected = calculateCheckoutTotals(cartItems, null, checkoutParams);
            expect(selected.shippingMethod.id).toBe('royal_mail_standard');
            expect(calculateTotals).toHaveBeenCalledWith(
                cartItems,
                null,
                checkoutParams.shippingAddress.postcode,
                checkoutParams.shippingMethodId,
            );

            const fallback = calculateCheckoutTotals(cartItems, null, {
                ...checkoutParams,
                shippingMethodId: 'invalid',
            });
            expect(fallback.shippingMethod.id).toBe('royal_mail_standard');
        });

        it('builds the persisted order payload from checkout data', () => {
            const totals = {
                subtotal: 40,
                discountAmount: 4,
                shippingCost: 5.99,
                taxAmount: 0,
                grandTotal: 41.99,
            };
            const shippingMethod = calculateCheckoutTotals([], null, checkoutParams).shippingMethod;
            const items = [{ book_id: 'book-1', quantity: 2, price: 20 }];

            expect(
                buildOrderPayload(checkoutParams, totals, shippingMethod, 'pi-1', items),
            ).toEqual({
                user_id: checkoutParams.userId,
                subtotal: 40,
                discount_amount: 4,
                shipping_cost: 5.99,
                tax_amount: 0,
                total_amount: 41.99,
                shipping_method_id: 'royal_mail_standard',
                shipping_method_name: 'Royal Mail Standard',
                payment_method: 'card',
                discount_id: 'discount-1',
                payment_intent_id: 'pi-1',
                shipping_address: checkoutParams.shippingAddress,
                items,
            });
        });

        it('validates the PaymentIntent result and converts major currency units to cents', async () => {
            await expect(createCheckoutPaymentIntent(checkoutParams, 41.99)).resolves.toEqual({
                data: { clientSecret: 'pi_secret', paymentIntentId: 'pi-1' },
                error: null,
            });
            expect(createPaymentIntentAction).toHaveBeenCalledWith(
                4199,
                checkoutParams.idempotencyKey,
                'GBP',
                { userId: checkoutParams.userId, customerEmail: checkoutParams.customerEmail },
                checkoutParams.stripeCustomerId,
            );

            jest.mocked(createPaymentIntentAction).mockResolvedValueOnce({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: null,
            });
            await expect(createCheckoutPaymentIntent(checkoutParams, 41.99)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED,
            });
        });

        it('formats the successful checkout result', () => {
            expect(
                createCheckoutResult('order-1', {
                    clientSecret: 'pi_secret',
                    paymentIntentId: 'pi-1',
                }),
            ).toEqual({
                data: {
                    success: true,
                    orderId: 'order-1',
                    clientSecret: 'pi_secret',
                    paymentIntentId: 'pi-1',
                    error: null,
                },
                error: null,
            });
        });
    });

    describe('persistCheckoutOrder', () => {
        const payload = {
            user_id: checkoutParams.userId,
            subtotal: 40,
            discount_amount: 4,
            shipping_cost: 5.99,
            tax_amount: 0,
            total_amount: 41.99,
            shipping_method_id: 'royal_mail_standard',
            shipping_method_name: 'Royal Mail Standard',
            payment_method: 'card',
            discount_id: checkoutParams.discountId,
            payment_intent_id: 'pi-1',
            shipping_address: checkoutParams.shippingAddress,
            items: [{ book_id: 'book-1', quantity: 2, price: 20 }],
        };

        it('persists the order and returns its ID', async () => {
            await expect(persistCheckoutOrder(checkoutParams, 'pi-1', payload)).resolves.toEqual({
                data: 'order-1',
                error: null,
            });
            expect(processOrderTransaction).toHaveBeenCalledWith(admin, payload);
        });

        it('recovers a matching order when the RPC result is ambiguous', async () => {
            jest.mocked(processOrderTransaction).mockResolvedValueOnce({
                data: null,
                error: { message: 'response lost' },
            } as never);
            orderLookup.mockResolvedValueOnce({
                data: { id: 'existing-order', user_id: checkoutParams.userId, status: 'pending' },
                error: null,
            });

            await expect(persistCheckoutOrder(checkoutParams, 'pi-1', payload)).resolves.toEqual({
                data: 'existing-order',
                error: null,
            });
            expect(cancelPaymentIntentAction).not.toHaveBeenCalled();
        });

        it('cancels the PaymentIntent if no order was created', async () => {
            jest.mocked(processOrderTransaction).mockResolvedValueOnce({
                data: null,
                error: { message: 'database rejected order' },
            } as never);

            await expect(persistCheckoutOrder(checkoutParams, 'pi-1', payload)).resolves.toEqual({
                data: null,
                error: 'Sanitized error',
            });
            expect(cancelPaymentIntentAction).toHaveBeenCalledWith('pi-1');
        });
    });

    describe('recoverCheckoutOrder', () => {
        it('returns a clear error when the order lookup itself fails', async () => {
            orderLookup.mockResolvedValueOnce({
                data: null,
                error: { message: 'lookup failed' },
            });

            const result = await recoverCheckoutOrder(admin, checkoutParams, 'pi-1', 'rpc failed');

            expect(result).toEqual({
                data: null,
                error:
                    'Checkout could not confirm whether your order was created. Please contact support before retrying.',
            });
            expect(cancelPaymentIntentAction).not.toHaveBeenCalled();
        });

        it('does not reuse an order belonging to a different user or in a terminal state', async () => {
            orderLookup.mockResolvedValueOnce({
                data: { id: 'other-user-order', user_id: 'another-user', status: 'pending' },
                error: null,
            });

            await expect(
                recoverCheckoutOrder(admin, checkoutParams, 'pi-1', 'rpc failed'),
            ).resolves.toEqual({
                data: null,
                error:
                    'The payment intent is already associated with an order that cannot be resumed. Please start a new checkout or contact support.',
            });
            expect(cancelPaymentIntentAction).not.toHaveBeenCalled();
        });

        it.each(['failed', 'cancelled'])(
            'does not resume a same-user %s order',
            async (status) => {
                orderLookup.mockResolvedValueOnce({
                    data: { id: 'terminal-order', user_id: checkoutParams.userId, status },
                    error: null,
                });

                await expect(
                    recoverCheckoutOrder(admin, checkoutParams, 'pi-1', 'rpc failed'),
                ).resolves.toEqual({
                    data: null,
                    error:
                        'The payment intent is already associated with an order that cannot be resumed. Please start a new checkout or contact support.',
                });
                expect(cancelPaymentIntentAction).not.toHaveBeenCalled();
            },
        );

        it('reports failed payment cleanup without hiding the order error', async () => {
            jest.mocked(cancelPaymentIntentAction).mockResolvedValueOnce({
                success: false,
                error: 'Stripe unavailable',
            });

            await expect(
                recoverCheckoutOrder(admin, checkoutParams, 'pi-1', 'rpc failed'),
            ).resolves.toEqual({
                data: null,
                error: 'rpc failed Payment authorization cleanup failed; please contact support.',
            });
        });

        it('uses the order-creation fallback when there is no RPC error', async () => {
            await expect(
                recoverCheckoutOrder(admin, checkoutParams, 'pi-1', null),
            ).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
            });
        });
    });
});
