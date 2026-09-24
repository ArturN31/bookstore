import { createBackendClient } from '@/utils/db/server';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import {
    ProcessCheckoutResult,
    AppliedDiscountState,
    ProcessCheckoutParams,
    DiscountRow,
    OrderDetailsRow,
    ProcessOrderPayloadItem,
} from '../CheckoutTypes';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { fetchOrderById, processOrderTransaction } from '../repositories/CheckoutOrderRepository';
import { withRetry } from '@/utils/network/retry';
import { calculateTotals, createPaymentIntentAction } from '../CheckoutUtils';
import { Database } from '@/database.types';

type BookRow = Database['public']['Tables']['books']['Row'];

export const executeCheckoutOrder = async (
    params: ProcessCheckoutParams,
): Promise<SafeQueryResult<ProcessCheckoutResult>> => {
    try {
        const supabase = await createBackendClient();

        if (!params.items || params.items.length === 0) {
            return { data: null, error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT };
        }

        const bookIds = params.items.map((i) => i.bookId);

        const booksResult = await safeSupabaseQuery<BookRow[]>(() =>
            withRetry(async () => {
                const res = await supabase.from('books').select('*').in('id', bookIds);
                return res;
            }),
        );

        if (booksResult.error)
            return { data: null, error: sanitizeSupabaseError(booksResult.error) };
        const books = booksResult.data;
        if (!books || books.length !== params.items.length)
            return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };

        const processItems: ProcessOrderPayloadItem[] = [];
        const cartItemsForTotals: CartItem[] = [];

        for (const itemParam of params.items) {
            const book = books.find((b) => b.id === itemParam.bookId);
            if (!book) return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };
            if (!book.is_active || book.stock_quantity < itemParam.quantity)
                return { data: null, error: APP_ERROR_MESSAGES.INSUFFICIENT_STOCK };

            const bookPrice = Number(book.price);

            processItems.push({
                book_id: book.id,
                quantity: itemParam.quantity,
                price: bookPrice,
            });

            cartItemsForTotals.push({
                ...book,
                quantity: itemParam.quantity,
            } as unknown as CartItem);
        }

        const rawSubtotal = cartItemsForTotals.reduce(
            (acc, item) => acc + Number(item.price) * item.quantity,
            0,
        );

        let discountState: AppliedDiscountState | null = null;
        if (params.discountId) {
            const discountResult = await safeSupabaseQuery<DiscountRow>(() =>
                withRetry(async () => {
                    const res = await supabase
                        .from('discounts')
                        .select('*')
                        .eq('id', params.discountId!)
                        .maybeSingle();
                    return res;
                }),
            );

            if (discountResult.error)
                return { data: null, error: sanitizeSupabaseError(discountResult.error) };

            const discount = discountResult.data;
            if (discount && discount.is_active) {
                const rawValue = Number(discount.value);
                const minimumSubtotal =
                    discount.minimum_subtotal !== null ? Number(discount.minimum_subtotal) : null;

                if (minimumSubtotal !== null && rawSubtotal < minimumSubtotal)
                    return {
                        data: null,
                        error: `This discount requires a minimum subtotal of $${minimumSubtotal.toFixed(2)}.`,
                    };

                discountState = {
                    code: discount.code,
                    discountPercent: discount.type === 'percentage' ? rawValue : 0,
                    discountAmount: discount.type === 'fixed_amount' ? rawValue : 0,
                    minimumSubtotal: minimumSubtotal,
                };
            }
        }

        const totals = calculateTotals(cartItemsForTotals, discountState);
        const totalAmountInCents = Math.round(totals.grandTotal * 100);

        // TODO: Pass user email or userId into createPaymentIntentAction to set metadata on Stripe PaymentIntent.
        const paymentIntentResult = await createPaymentIntentAction(
            totalAmountInCents,
            'gbp', // TODO: Update default currency parameter to match project's target currency (e.g., 'gbp').
            params.idempotencyKey,
        );
        if (!paymentIntentResult.success || !paymentIntentResult.clientSecret)
            return {
                data: null,
                error: paymentIntentResult.error ?? APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED,
            };

        // TODO: Update processOrderTransaction or order payload to persist paymentIntentResult.paymentIntentId inside database order record.
        const rpcResult = await safeSupabaseQuery<{ readonly order_id: string }>(() =>
            withRetry(async () => {
                const res = await processOrderTransaction(supabase, {
                    user_id: params.userId,
                    total_amount: totals.grandTotal,
                    payment_method: params.paymentMethod,
                    discount_id: params.discountId,
                    items: processItems,
                });
                return {
                    ...res,
                    data: res.data as unknown as { readonly order_id: string },
                };
            }),
        );
        if (rpcResult.error || !rpcResult.data)
            return {
                data: null,
                error: rpcResult.error
                    ? sanitizeSupabaseError(rpcResult.error)
                    : APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
            };

        const responseObj = rpcResult.data;

        return {
            data: {
                success: true,
                orderId: responseObj.order_id,
                clientSecret: paymentIntentResult.clientSecret,
                // TODO: Include paymentIntentId in returned data object for client-side Stripe Elements confirmation.
                error: null,
            },
            error: null,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};

export const getOrderDetailsById = async (
    orderId: string,
): Promise<SafeQueryResult<OrderDetailsRow>> => {
    try {
        const supabase = await createBackendClient();

        const queryResult = await safeSupabaseQuery<OrderDetailsRow>(() =>
            withRetry(() => fetchOrderById(supabase, orderId)),
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
