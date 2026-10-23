import { createBackendClient } from '@/utils/db/server';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import {
    ProcessCheckoutParams,
    ProcessCheckoutResult,
    OrderWithRelations,
} from '../CheckoutTypes';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { fetchOrderById } from '../repositories/CheckoutOrderRepository';
import { withRetry } from '@/utils/network/retry';
import {
    buildOrderPayload,
    calculateCheckoutTotals,
    calculateRawSubtotal,
    createCheckoutPaymentIntent,
    createCheckoutResult,
    loadCheckoutItems,
    loadDiscountState,
    persistCheckoutOrder,
} from './CheckoutServiceUtils';

export const executeCheckoutOrder = async (
    params: ProcessCheckoutParams,
): Promise<SafeQueryResult<ProcessCheckoutResult>> => {
    try {
        const supabase = await createBackendClient();
        const checkoutItems = await loadCheckoutItems(supabase, params);
        if (checkoutItems.error) return { data: null, error: checkoutItems.error };
        if (!checkoutItems.data)
            return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };

        const subtotal = calculateRawSubtotal(checkoutItems.data.cartItems);
        const discount = await loadDiscountState(supabase, params.discountId, subtotal);
        if (discount.error) return { data: null, error: discount.error };

        const checkoutTotals = calculateCheckoutTotals(
            checkoutItems.data.cartItems,
            discount.data,
            params,
        );
        const paymentIntent = await createCheckoutPaymentIntent(
            params,
            checkoutTotals.totals.grandTotal,
        );
        if (!paymentIntent.data) return { data: null, error: paymentIntent.error };

        const payload = buildOrderPayload(
            params,
            checkoutTotals.totals,
            checkoutTotals.shippingMethod,
            paymentIntent.data.paymentIntentId,
            checkoutItems.data.processItems,
        );
        const order = await persistCheckoutOrder(
            params,
            paymentIntent.data.paymentIntentId,
            payload,
        );
        if (order.error) return { data: null, error: order.error };
        if (!order.data)
            return { data: null, error: APP_ERROR_MESSAGES.ORDER_CREATION_FAILED };

        return createCheckoutResult(order.data, paymentIntent.data);
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const getOrderDetailsById = async (
    orderId: string,
): Promise<SafeQueryResult<OrderWithRelations>> => {
    try {
        const supabase = await createBackendClient();

        const queryResult = await safeSupabaseQuery<OrderWithRelations>(() =>
            withRetry(async () => {
                const res = await fetchOrderById(supabase, orderId);
                return {
                    ...res,
                    data: res.data as unknown as OrderWithRelations,
                };
            }),
        );

        if (queryResult.error || !queryResult.data)
            return {
                data: null,
                error: queryResult.error
                    ? sanitizeSupabaseError(queryResult.error)
                    : APP_ERROR_MESSAGES.ORDER_NOT_FOUND,
            };

        return queryResult;
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
