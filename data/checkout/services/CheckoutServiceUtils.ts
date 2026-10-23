import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { createAdminClient } from '@/utils/db/admin';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';
import {
    AppliedDiscountState,
    CartCheckoutItem,
    DiscountRow,
    ProcessCheckoutParams,
    ProcessCheckoutResult,
    ProcessOrderPayload,
    ProcessOrderPayloadItem,
} from '../CheckoutTypes';
import { DEFAULT_CURRENCY, SHIPPING_METHODS } from '../CheckoutConstants';
import {
    cancelPaymentIntentAction,
    createPaymentIntentAction,
} from '../CheckoutStripeServer';
import { calculateTotals } from '../CheckoutUtils';
import { processOrderTransaction } from '../repositories/CheckoutOrderRepository';

type BookRow = Database['public']['Tables']['books']['Row'];

export interface PreparedCheckoutItems {
    readonly processItems: readonly ProcessOrderPayloadItem[];
    readonly cartItems: readonly CartCheckoutItem[];
}

export interface CheckoutTotals {
    readonly totals: ReturnType<typeof calculateTotals>;
    readonly shippingMethod: (typeof SHIPPING_METHODS)[number];
}

export interface PaymentIntentDetails {
    readonly clientSecret: string;
    readonly paymentIntentId: string;
}

export async function loadCheckoutItems(
    supabase: SupabaseClient<Database>,
    params: ProcessCheckoutParams,
): Promise<SafeQueryResult<PreparedCheckoutItems>> {
    if (params.items.length === 0)
        return { data: null, error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT };

    const bookIds = params.items.map(({ bookId }) => bookId);
    const booksResult = await safeSupabaseQuery<BookRow[]>(() =>
        withRetry(async () => supabase.from('books').select('*').in('id', bookIds)),
    );

    if (booksResult.error)
        return { data: null, error: sanitizeSupabaseError(booksResult.error) };

    if (!booksResult.data || booksResult.data.length !== params.items.length)
        return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };

    const processItems: ProcessOrderPayloadItem[] = [];
    const cartItems: CartCheckoutItem[] = [];

    for (const requestedItem of params.items) {
        const book = booksResult.data.find(({ id }) => id === requestedItem.bookId);
        if (!book || !book.is_active || book.stock_quantity < requestedItem.quantity)
            return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };

        const bookPrice = Number(book.price);
        processItems.push({
            book_id: book.id,
            quantity: requestedItem.quantity,
            price: bookPrice,
        });
        cartItems.push({ ...book, quantity: requestedItem.quantity });
    }

    return { data: { processItems, cartItems }, error: null };
}

export async function loadDiscountState(
    supabase: SupabaseClient<Database>,
    discountId: string | null,
    subtotal: number,
): Promise<SafeQueryResult<AppliedDiscountState | null>> {
    if (!discountId) return { data: null, error: null };

    const discountResult = await safeSupabaseQuery<DiscountRow>(() =>
        withRetry(async () =>
            supabase.from('discounts').select('*').eq('id', discountId).maybeSingle(),
        ),
    );

    if (discountResult.error)
        return { data: null, error: sanitizeSupabaseError(discountResult.error) };

    const discount = discountResult.data;
    if (!discount) return { data: null, error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
    if (!discount.is_active) return { data: null, error: null };

    const minimumSubtotal =
        discount.minimum_subtotal !== null ? Number(discount.minimum_subtotal) : null;
    if (minimumSubtotal !== null && subtotal < minimumSubtotal)
        return {
            data: null,
            error: `This discount requires a minimum subtotal of £${minimumSubtotal.toFixed(2)}.`,
        };

    const rawValue = Number(discount.value);
    return {
        data: {
            id: discount.id,
            code: discount.code,
            discountPercent: discount.type === 'percentage' ? rawValue : 0,
            discountAmount: discount.type === 'fixed_amount' ? rawValue : 0,
            minimumSubtotal,
        },
        error: null,
    };
}

export function calculateRawSubtotal(cartItems: readonly CartCheckoutItem[]): number {
    return cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

export function calculateCheckoutTotals(
    cartItems: readonly CartCheckoutItem[],
    discount: AppliedDiscountState | null,
    params: ProcessCheckoutParams,
): CheckoutTotals {
    return {
        totals: calculateTotals(
            cartItems,
            discount,
            params.shippingAddress.postcode,
            params.shippingMethodId,
        ),
        shippingMethod:
            SHIPPING_METHODS.find(({ id }) => id === params.shippingMethodId) ?? SHIPPING_METHODS[0],
    };
}

export async function createCheckoutPaymentIntent(
    params: ProcessCheckoutParams,
    amount: number,
): Promise<SafeQueryResult<PaymentIntentDetails>> {
    const result = await createPaymentIntentAction(
        Math.round(amount * 100),
        params.idempotencyKey,
        DEFAULT_CURRENCY,
        { userId: params.userId, customerEmail: params.customerEmail },
        params.stripeCustomerId,
    );

    if (!result.success || !result.clientSecret || !result.paymentIntentId)
        return {
            data: null,
            error: result.error ?? APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED,
        };

    return {
        data: { clientSecret: result.clientSecret, paymentIntentId: result.paymentIntentId },
        error: null,
    };
}

export function buildOrderPayload(
    params: ProcessCheckoutParams,
    totals: CheckoutTotals['totals'],
    shippingMethod: CheckoutTotals['shippingMethod'],
    paymentIntentId: string,
    items: readonly ProcessOrderPayloadItem[],
): ProcessOrderPayload {
    return {
        user_id: params.userId,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        shipping_cost: totals.shippingCost,
        tax_amount: totals.taxAmount,
        total_amount: totals.grandTotal,
        shipping_method_id: shippingMethod.id,
        shipping_method_name: shippingMethod.name,
        payment_method: params.paymentMethod,
        discount_id: params.discountId,
        payment_intent_id: paymentIntentId,
        shipping_address: params.shippingAddress,
        items,
    };
}

export async function recoverCheckoutOrder(
    adminClient: SupabaseClient<Database>,
    params: ProcessCheckoutParams,
    paymentIntentId: string,
    rpcError: string | null,
): Promise<SafeQueryResult<string>> {
    const orderLookup = await adminClient
        .from('orders')
        .select('id, user_id, status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();

    if (orderLookup.error)
        return {
            data: null,
            error:
                'Checkout could not confirm whether your order was created. Please contact support before retrying.',
        };

    const existingOrder = orderLookup.data;
    if (existingOrder) {
        if (
            existingOrder.user_id === params.userId &&
            !['failed', 'cancelled'].includes(existingOrder.status)
        )
            return { data: existingOrder.id, error: null };

        return {
            data: null,
            error:
                'The payment intent is already associated with an order that cannot be resumed. Please start a new checkout or contact support.',
        };
    }

    const cancellation = await cancelPaymentIntentAction(paymentIntentId);
    const checkoutError = rpcError
        ? sanitizeSupabaseError(rpcError)
        : APP_ERROR_MESSAGES.ORDER_CREATION_FAILED;

    return {
        data: null,
        error: cancellation.success
            ? checkoutError
            : `${checkoutError} Payment authorization cleanup failed; please contact support.`,
    };
}

export async function persistCheckoutOrder(
    params: ProcessCheckoutParams,
    paymentIntentId: string,
    payload: ProcessOrderPayload,
): Promise<SafeQueryResult<string>> {
    const adminClient = await createAdminClient();
    const rpcResult = await safeSupabaseQuery<{ readonly order_id: string }>(() =>
        withRetry(async () => {
            const result = await processOrderTransaction(adminClient, payload);
            return {
                ...result,
                data: result.data as unknown as { readonly order_id: string },
            };
        }),
    );

    if (rpcResult.data) return { data: rpcResult.data.order_id, error: null };

    return recoverCheckoutOrder(adminClient, params, paymentIntentId, rpcResult.error);
}

export function createCheckoutResult(
    orderId: string,
    paymentIntent: PaymentIntentDetails,
): SafeQueryResult<ProcessCheckoutResult> {
    return {
        data: {
            success: true,
            orderId,
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
            error: null,
        },
        error: null,
    };
}
