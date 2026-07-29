import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/CartService';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export const ensureCartExists = async (userId: string): Promise<SafeQueryResult<string>> => {
    try {
        const lookup = await getUsersCartID(userId);
        if (lookup.error)
            return {
                data: null,
                error: sanitizeSupabaseError(lookup.error),
            };
        if (lookup.data) return { data: lookup.data, error: null };

        const created = await createUsersCart(userId);
        if (created.error)
            return {
                data: null,
                error: sanitizeSupabaseError(created.error),
            };
        if (!created.data)
            return {
                data: null,
                error: 'Cart creation failed.',
            };
        return { data: created.data, error: null };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};

const SUCCESS_MESSAGES: Record<string, string> = {
    INSERT: 'Item added to your cart!',
    UPDATE: 'Cart quantity updated.',
    REMOVE: 'Item removed from your cart.',
};

const CART_OPERATIONS: Record<
    string,
    (cartId: string, bookId: string, qty: number) => Promise<SafeQueryResult<boolean>>
> = {
    INSERT: async (cartId, bookId, qty) => {
        const result = await addItemToUsersCart(cartId, bookId, qty);
        if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
        return { data: result.data ?? true, error: null };
    },
    UPDATE: async (cartId, bookId, qty) => {
        const result = await updateItemInUsersCart(cartId, bookId, qty);
        if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
        return { data: result.data ?? true, error: null };
    },
    REMOVE: async (cartId, bookId) => {
        const result = await removeItemFromUsersCart(cartId, bookId);
        if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
        return { data: result.data ?? true, error: null };
    },
};

export const executeCartOperation = async (
    type: string,
    cartId: string,
    bookId: string,
    quantity: number,
): Promise<SafeQueryResult<boolean> & { message?: string }> => {
    const operation = CART_OPERATIONS[type];

    if (!operation) return { data: null, error: 'Unsupported action type.' };

    try {
        const result = await operation(cartId, bookId, quantity);
        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };
        return {
            ...result,
            message: SUCCESS_MESSAGES[type] || 'Cart updated successfully.',
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
