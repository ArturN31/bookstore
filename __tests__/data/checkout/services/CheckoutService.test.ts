/**
 * @jest-environment node
 */

import {
    executeCheckoutOrder,
    getOrderDetailsById,
} from '@/data/checkout/services/CheckoutService';
import * as checkoutUtils from '@/data/checkout/services/CheckoutServiceUtils';
import { fetchOrderById } from '@/data/checkout/repositories/CheckoutOrderRepository';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import {
    OrderWithRelations,
    ProcessCheckoutParams,
    ProcessCheckoutResult,
    ProcessOrderPayload,
} from '@/data/checkout/CheckoutTypes';
import { SHIPPING_METHODS } from '@/data/checkout/CheckoutConstants';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutOrderRepository');
jest.mock('@/data/checkout/services/CheckoutServiceUtils');

describe('CheckoutService', () => {
    let mockSupabase: SupabaseClient<Database>;

    const checkoutParams: ProcessCheckoutParams = {
        userId: 'user-uuid-123',
        customerEmail: 'user@example.com',
        stripeCustomerId: 'cus_123',
        items: [{ bookId: 'book-1', quantity: 2 }],
        discountId: 'discount-1',
        paymentMethod: 'card',
        shippingMethodId: 'royal_mail_standard',
        idempotencyKey: 'idemp-key-999',
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            streetAddress: '123 Main St',
            city: 'Glasgow',
            postcode: 'G1 1AA',
            country: 'United Kingdom',
            phoneNumber: '01234567890',
        },
    };

    const preparedItems = {
        processItems: [{ book_id: 'book-1', quantity: 2, price: 20 }],
        cartItems: [{ id: 'book-1', price: '20.00', quantity: 2 }],
    } as unknown as NonNullable<
        Awaited<ReturnType<typeof checkoutUtils.loadCheckoutItems>>['data']
    >;
    const checkoutTotals = {
        totals: {
            subtotal: 40,
            discountAmount: 4,
            shippingCost: 5.99,
            taxAmount: 0,
            grandTotal: 41.99,
        },
        shippingMethod: SHIPPING_METHODS[0],
    };
    const paymentIntent = {
        clientSecret: 'pi_secret',
        paymentIntentId: 'pi_test_123',
    };
    const orderPayload = {
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
        payment_intent_id: paymentIntent.paymentIntentId,
        shipping_address: checkoutParams.shippingAddress,
        items: preparedItems.processItems,
    } satisfies ProcessOrderPayload;
    const checkoutResult: SafeQueryResult<ProcessCheckoutResult> = {
        data: {
            success: true,
            orderId: 'order-1',
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            error: null,
        },
        error: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {} as SupabaseClient<Database>;
        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (query) => (await query()) as never);
        jest.mocked(withRetry).mockImplementation(async (query) => (await query()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((error: unknown) =>
            typeof error === 'string' ? error : 'Sanitized error',
        );

        jest.mocked(checkoutUtils.loadCheckoutItems).mockResolvedValue({
            data: preparedItems,
            error: null,
        });
        jest.mocked(checkoutUtils.loadDiscountState).mockResolvedValue({
            data: null,
            error: null,
        });
        jest.mocked(checkoutUtils.calculateRawSubtotal).mockReturnValue(40);
        jest.mocked(checkoutUtils.calculateCheckoutTotals).mockReturnValue(checkoutTotals);
        jest.mocked(checkoutUtils.createCheckoutPaymentIntent).mockResolvedValue({
            data: paymentIntent,
            error: null,
        });
        jest.mocked(checkoutUtils.buildOrderPayload).mockReturnValue(orderPayload);
        jest.mocked(checkoutUtils.persistCheckoutOrder).mockResolvedValue({
            data: 'order-1',
            error: null,
        });
        jest.mocked(checkoutUtils.createCheckoutResult).mockReturnValue(checkoutResult);
    });

    describe('executeCheckoutOrder', () => {
        it('coordinates checkout preparation, payment, persistence, and result creation', async () => {
            const result = await executeCheckoutOrder(checkoutParams);

            expect(result).toEqual(checkoutResult);
            expect(checkoutUtils.loadCheckoutItems).toHaveBeenCalledWith(
                mockSupabase,
                checkoutParams,
            );
            expect(checkoutUtils.loadDiscountState).toHaveBeenCalledWith(
                mockSupabase,
                checkoutParams.discountId,
                40,
            );
            expect(checkoutUtils.calculateRawSubtotal).toHaveBeenCalledWith(
                preparedItems.cartItems,
            );
            expect(checkoutUtils.calculateCheckoutTotals).toHaveBeenCalledWith(
                preparedItems.cartItems,
                null,
                checkoutParams,
            );
            expect(checkoutUtils.createCheckoutPaymentIntent).toHaveBeenCalledWith(
                checkoutParams,
                checkoutTotals.totals.grandTotal,
            );
            expect(checkoutUtils.buildOrderPayload).toHaveBeenCalledWith(
                checkoutParams,
                checkoutTotals.totals,
                checkoutTotals.shippingMethod,
                paymentIntent.paymentIntentId,
                preparedItems.processItems,
            );
            expect(checkoutUtils.persistCheckoutOrder).toHaveBeenCalledWith(
                checkoutParams,
                paymentIntent.paymentIntentId,
                orderPayload,
            );
            expect(checkoutUtils.createCheckoutResult).toHaveBeenCalledWith(
                'order-1',
                paymentIntent,
            );
        });

        it('stops when checkout items cannot be prepared', async () => {
            jest.mocked(checkoutUtils.loadCheckoutItems).mockResolvedValueOnce({
                data: null,
                error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK,
            });

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK,
            });
            expect(checkoutUtils.loadDiscountState).not.toHaveBeenCalled();
            expect(checkoutUtils.createCheckoutPaymentIntent).not.toHaveBeenCalled();
        });

        it('uses the stock fallback if item preparation unexpectedly returns no result or error', async () => {
            jest.mocked(checkoutUtils.loadCheckoutItems).mockResolvedValueOnce({
                data: null,
                error: null,
            } as never);

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK,
            });
            expect(checkoutUtils.loadDiscountState).not.toHaveBeenCalled();
        });

        it('stops when discount lookup fails', async () => {
            jest.mocked(checkoutUtils.loadDiscountState).mockResolvedValueOnce({
                data: null,
                error: 'Discount lookup failed',
            });

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: 'Discount lookup failed',
            });
            expect(checkoutUtils.createCheckoutPaymentIntent).not.toHaveBeenCalled();
        });

        it('stops when PaymentIntent creation fails', async () => {
            jest.mocked(checkoutUtils.createCheckoutPaymentIntent).mockResolvedValueOnce({
                data: null,
                error: APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED,
            });

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED,
            });
            expect(checkoutUtils.persistCheckoutOrder).not.toHaveBeenCalled();
        });

        it('returns persistence errors without formatting a success response', async () => {
            jest.mocked(checkoutUtils.persistCheckoutOrder).mockResolvedValueOnce({
                data: null,
                error: 'Order persistence failed',
            });

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: 'Order persistence failed',
            });
            expect(checkoutUtils.createCheckoutResult).not.toHaveBeenCalled();
        });

        it('returns an explicit fallback if persistence unexpectedly returns no order ID', async () => {
            jest.mocked(checkoutUtils.persistCheckoutOrder).mockResolvedValueOnce({
                data: null,
                error: null,
            } as never);

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
            });
        });

        it('sanitizes unexpected failures at the service boundary', async () => {
            const failure = new Error('Unexpected checkout failure');
            jest.mocked(createBackendClient).mockRejectedValueOnce(failure);

            await expect(executeCheckoutOrder(checkoutParams)).resolves.toEqual({
                data: null,
                error: 'Sanitized error',
            });
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(failure);
        });
    });

    describe('getOrderDetailsById', () => {
        const order: OrderWithRelations = {
            id: 'order-1',
            user_id: checkoutParams.userId,
            subtotal: 40,
            discount_amount: 0,
            shipping_cost: 5.99,
            tax_amount: 0,
            total_amount: 45.99,
            shipping_method_id: 'royal_mail_standard',
            shipping_method_name: 'Royal Mail Standard',
            status: 'paid',
            payment_method: 'card',
            created_at: '2026-01-01T00:00:00Z',
            stripe_checkout_session_id: null,
            stripe_payment_intent_id: 'pi-1',
            order_items: [],
            order_discounts: [],
            order_addresses: [],
            inventory_restored: false,
        };

        it('returns the fetched order', async () => {
            jest.mocked(fetchOrderById).mockResolvedValue({ data: order, error: null } as never);

            await expect(getOrderDetailsById(order.id)).resolves.toEqual({
                data: order,
                error: null,
            });
            expect(fetchOrderById).toHaveBeenCalledWith(mockSupabase, order.id);
        });

        it('returns ORDER_NOT_FOUND when the order does not exist', async () => {
            jest.mocked(fetchOrderById).mockResolvedValue({ data: null, error: null } as never);

            await expect(getOrderDetailsById('missing')).resolves.toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.ORDER_NOT_FOUND,
            });
        });

        it('sanitizes database and unexpected lookup errors', async () => {
            const databaseError = { message: 'database error' };
            jest.mocked(fetchOrderById).mockResolvedValue({
                data: null,
                error: databaseError,
            } as never);
            await expect(getOrderDetailsById(order.id)).resolves.toEqual({
                data: null,
                error: 'Sanitized error',
            });
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(databaseError);

            const unexpectedError = new Error('client failure');
            jest.mocked(fetchOrderById).mockRejectedValueOnce(unexpectedError);
            await expect(getOrderDetailsById(order.id)).resolves.toEqual({
                data: null,
                error: 'Sanitized error',
            });
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(unexpectedError);
        });
    });
});
