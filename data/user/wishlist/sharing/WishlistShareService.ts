import {
    fetchWishlistByUsername,
    fetchWishlistByToken,
    PublicWishlistProfile,
    TokenWishlistProfile,
} from './WishlistShareRepository';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export const getPublicWishlistByUsername = async (
    username: string,
): Promise<SafeQueryResult<PublicWishlistProfile | null>> => {
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

export const getWishlistByShareToken = async (
    token: string,
): Promise<SafeQueryResult<TokenWishlistProfile | null>> => {
    try {
        if (!token || token.trim() === '')
            return { data: null, error: 'Invalid share token provided.' };
        return await fetchWishlistByToken(token);
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
