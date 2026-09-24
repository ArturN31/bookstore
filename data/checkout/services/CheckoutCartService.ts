import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { createBackendClient } from '@/utils/db/server';
import { fetchFullCartWithBooks } from '../repositories/CheckoutCartRepository';
import { withRetry } from '@/utils/network/retry';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export const getActiveCartCheckoutItems = async (
    userId: string,
): Promise<SafeQueryResult<CartItem[]>> => {
    try {
        const supabase = await createBackendClient();

        const rawQueryResult = await safeSupabaseQuery(() =>
            withRetry(() => fetchFullCartWithBooks(supabase, userId)),
        );
        if (rawQueryResult.error || !rawQueryResult.data)
            return {
                data: null,
                error: rawQueryResult.error
                    ? sanitizeSupabaseError(rawQueryResult.error)
                    : APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT,
            };

        const items = rawQueryResult.data.shopping_cart_items;
        if (!items || items.length === 0)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT,
            };

        const formattedItems: CartItem[] = [];

        for (const item of items) {
            const book = item.books;
            if (!book) continue;

            // TODO: Ensure book prices are validated against current live database rows before sending final line item amounts to Stripe.
            formattedItems.push({
                ...book,
                quantity: item.quantity,
            } as unknown as CartItem);
        }

        if (formattedItems.length === 0)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT,
            };

        return {
            data: formattedItems,
            error: null,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
