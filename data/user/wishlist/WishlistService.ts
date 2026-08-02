import { addToWishlist, removeFromWishlist } from './WishlistRepository';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError, APP_ERROR_MESSAGES } from '@/utils/errors/SupabaseErrorHandler';

const WISHLIST_OPERATIONS: Record<
    string,
    (userId: string, bookId: string) => Promise<SafeQueryResult<boolean>>
> = {
    INSERT: addToWishlist,
    REMOVE: removeFromWishlist,
};

export const executeWishlistOperation = async (
    type: string,
    userId: string,
    bookId: string,
): Promise<SafeQueryResult<boolean> & { message?: string }> => {
    const operation = WISHLIST_OPERATIONS[type];
    if (!operation) return { data: null, error: APP_ERROR_MESSAGES.UNSUPPORTED_WISHLIST_ACTION };

    try {
        const result = await operation(userId, bookId);

        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };
        return {
            ...result,
            message: type === 'INSERT' ? 'Item added to wishlist.' : 'Item removed from wishlist.',
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
