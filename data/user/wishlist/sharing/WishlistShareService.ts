import { fetchWishlistByUsername, SharedWishlistProfile } from './WishlistShareRepository';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export const getPublicWishlistByUsername = async (
    username: string,
): Promise<SafeQueryResult<SharedWishlistProfile | null>> => {
    try {
        if (!username || username.trim() === '')
            return { data: null, error: 'Invalid username provided.' };
        return await fetchWishlistByUsername(username);
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
