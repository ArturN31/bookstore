import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';

export const addToWishlist = async (
    userId: string,
    bookId: string,
): Promise<SafeQueryResult<boolean>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createBackendClient();
            const result = await safeSupabaseQuery(async () =>
                supabase
                    .from('wishlist')
                    .insert([{ user_id: userId, book_id: bookId }])
                    .select(),
            );

            if (result.error)
                return {
                    data: null,
                    error: sanitizeSupabaseError(result.error),
                };
            return { data: true, error: null };
        });
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};

export const removeFromWishlist = async (
    userId: string,
    bookId: string,
): Promise<SafeQueryResult<boolean>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createBackendClient();
            const result = await safeSupabaseQuery(async () =>
                supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', userId)
                    .eq('book_id', bookId)
                    .select(),
            );

            if (result.error)
                return {
                    data: null,
                    error: sanitizeSupabaseError(result.error),
                };
            return { data: true, error: null };
        });
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
