import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';
import { WISHLIST_TABLE } from '../../UserConstants';
import { createAdminClient } from '@/utils/db/admin';
import { createBackendClient } from '@/utils/db/server';

export interface WishlistBookDto {
    id: string;
    title: string;
    author: string;
    price: string;
    image_url: string;
    description: string;
}

export interface WishlistSharedItem {
    id: string;
    created_at: string;
    book_id: string;
    books: WishlistBookDto | null;
}

export interface PublicWishlistProfile {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    wishlist: WishlistSharedItem[];
}

export interface TokenWishlistProfile {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    wishlist: WishlistSharedItem[];
}

const WISHLIST_SELECT_QUERY = `
    id,
    username,
    first_name,
    last_name,
    is_wishlist_public,
    ${WISHLIST_TABLE}(
        id,
        created_at,
        book_id,
        books(
            id,
            title,
            author,
            price,
            image_url,
            description
        )
    )
`;

export const fetchWishlistByUsername = async (
    username: string,
): Promise<SafeQueryResult<PublicWishlistProfile | null>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createAdminClient();

            const result = await safeSupabaseQuery(async () =>
                supabase
                    .from('users')
                    .select(WISHLIST_SELECT_QUERY)
                    .eq('username', username)
                    .eq('is_wishlist_public', true)
                    .maybeSingle(),
            );

            if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
            if (!result.data) return { data: null, error: null };

            const rawData = result.data as Record<string, unknown>;
            const rawWishlist = Array.isArray(rawData[WISHLIST_TABLE])
                ? (rawData[WISHLIST_TABLE] as WishlistSharedItem[])
                : [];
            const profile: PublicWishlistProfile = {
                user_id: String(rawData.id),
                username: String(rawData.username),
                first_name: String(rawData.first_name),
                last_name: String(rawData.last_name),
                wishlist: rawWishlist,
            };

            return { data: profile, error: null };
        });
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const fetchWishlistByToken = async (
    token: string,
): Promise<SafeQueryResult<TokenWishlistProfile | null>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createAdminClient();

            const result = await safeSupabaseQuery(async () =>
                supabase
                    .from('users')
                    .select(WISHLIST_SELECT_QUERY)
                    .eq('wishlist_share_token', token)
                    .maybeSingle(),
            );

            if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
            if (!result.data) return { data: null, error: null };

            const rawData = result.data as Record<string, unknown>;
            const rawWishlist = Array.isArray(rawData[WISHLIST_TABLE])
                ? (rawData[WISHLIST_TABLE] as WishlistSharedItem[])
                : [];
            const profile: TokenWishlistProfile = {
                user_id: String(rawData.id),
                username: String(rawData.username),
                first_name: String(rawData.first_name),
                last_name: String(rawData.last_name),
                wishlist: rawWishlist,
            };

            return { data: profile, error: null };
        });
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const updateWishlistVisibilityAndToken = async (
    userId: string,
    isPublic: boolean,
    newToken?: string | null,
): Promise<{ error: string | null }> => {
    try {
        const supabase = await createBackendClient();
        const updatePayload: { is_wishlist_public: boolean; wishlist_share_token?: string | null } =
            {
                is_wishlist_public: isPublic,
            };

        if (isPublic) {
            updatePayload.wishlist_share_token = null;
        } else if (newToken !== undefined) {
            updatePayload.wishlist_share_token = newToken;
        }

        const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);

        if (error) return { error: sanitizeSupabaseError(error) };
        return { error: null };
    } catch (err: unknown) {
        return { error: sanitizeSupabaseError(err) };
    }
};
