import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';
import { WISHLIST_TABLE } from '../../UserConstants';
import { createAdminClient } from '@/utils/db/admin';

export interface SharedBookData {
    id: string;
    title: string;
    author: string;
    price: string;
    image_url: string;
    description: string;
}

export interface SharedWishlistItem {
    id: string;
    created_at: string;
    book_id: string;
    books: SharedBookData | null;
}

export interface SharedWishlistProfile {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    wishlist: SharedWishlistItem[];
}

export const fetchWishlistByUsername = async (
    username: string,
): Promise<SafeQueryResult<SharedWishlistProfile | null>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createAdminClient();

            const result = await safeSupabaseQuery(async () =>
                supabase
                    .from('users')
                    .select(
                        `
                        id,
                        username,
                        first_name,
                        last_name,
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
                    `,
                    )
                    .eq('username', username)
                    .maybeSingle(),
            );

            if (result.error)
                return {
                    data: null,
                    error: sanitizeSupabaseError(result.error),
                };

            if (!result.data) return { data: null, error: null };

            const rawData = result.data as Record<string, unknown>;
            const rawWishlist = Array.isArray(rawData[WISHLIST_TABLE])
                ? (rawData[WISHLIST_TABLE] as SharedWishlistItem[])
                : [];

            const profile: SharedWishlistProfile = {
                user_id: String(rawData.id),
                username: String(rawData.username),
                first_name: String(rawData.first_name),
                last_name: String(rawData.last_name),
                wishlist: rawWishlist,
            };

            return { data: profile, error: null };
        });
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
