'use server';

import { createBackendClient } from '@/utils/db/server';
import { Database } from '@/database.types';
import * as Repo from './UserRepository';
import { UserServiceLogPrefix } from './UserConstants';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { ActionResponse, getAuthenticatedUserId } from './UserServiceUtils';

type UserRow = Database['public']['Tables']['users']['Row'];
type WishlistRow = Database['public']['Tables']['wishlist']['Row'];

export type { ActionResponse };

export const getUserData = async (): Promise<ActionResponse<UserRow & { email: string }>> => {
    try {
        const supabase = await createBackendClient();

        const authCheck = await getAuthenticatedUserId(supabase, 'getUserData');
        if (authCheck.error || !authCheck.data) return { data: null, error: authCheck.error };

        const userID = authCheck.data;

        const authResult = await Repo.fetchUserAuthData(supabase);
        const email = authResult.data?.user?.email ?? '';

        const profileResult = await withRetry<{ data: UserRow | null; error: string | null }>(
            async () => {
                const res = (await safeSupabaseQuery(
                    async () => await Repo.fetchUserProfileById(supabase, userID),
                )) as unknown as { data: UserRow | null; error: unknown };
                if (res.error) {
                    if (res.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                        return { data: null, error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
                    throw new Error(
                        typeof res.error === 'string' ? res.error : JSON.stringify(res.error),
                    );
                }
                return { data: res.data ?? null, error: null };
            },
        );

        if (profileResult.error) {
            if (profileResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: null, error: null };
            const sanitizedError = sanitizeSupabaseError(profileResult.error);
            return { data: null, error: sanitizedError };
        }

        const userProfile = profileResult.data;
        if (!userProfile) return { data: null, error: null };

        return {
            data: {
                ...userProfile,
                email: email,
            },
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Unexpected Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        return { data: null, error: sanitizedError };
    }
};

export const getUserWishlist = async (): Promise<ActionResponse<WishlistRow[]>> => {
    try {
        const supabase = await createBackendClient();

        const authCheck = await getAuthenticatedUserId(supabase, 'getUserWishlist');
        if (authCheck.error || !authCheck.data) return { data: null, error: authCheck.error };

        const userID = authCheck.data;

        const wishlistResult = await withRetry<{
            data: WishlistRow[] | null;
            error: string | null;
        }>(async () => {
            const res = (await safeSupabaseQuery(
                async () => await Repo.fetchWishlistByUserId(supabase, userID),
            )) as unknown as { data: WishlistRow[] | null; error: unknown };

            if (res.error) {
                if (res.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                    return { data: [], error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
                throw new Error(
                    typeof res.error === 'string' ? res.error : JSON.stringify(res.error),
                );
            }
            return { data: res.data ?? [], error: null };
        });

        if (wishlistResult.error) {
            if (wishlistResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: [], error: null };
            const sanitizedError = sanitizeSupabaseError(wishlistResult.error);
            return { data: null, error: sanitizedError };
        }

        return {
            data: wishlistResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Wishlist System Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        return { data: null, error: sanitizedError };
    }
};

export const getPublicUserProfile = async (
    username: string,
): Promise<ActionResponse<{ username: string; created_at: string }>> => {
    try {
        const supabase = await createBackendClient();

        const profileResult = await withRetry<{
            data: { username: string; created_at: string } | null;
            error: string | null;
        }>(async () => {
            const res = await safeSupabaseQuery(
                async () => await Repo.fetchPublicUserProfileByUsername(supabase, username),
            );

            if (res.error) {
                if (res.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                    return { data: null, error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
                throw new Error(res.error);
            }

            return { data: res.data, error: null };
        });

        if (profileResult.error) {
            if (profileResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED) {
                return { data: null, error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND };
            }
            const sanitizedError = sanitizeSupabaseError(profileResult.error);
            return { data: null, error: sanitizedError };
        }

        if (!profileResult.data)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND };

        return {
            data: profileResult.data,
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Public Profile Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        return { data: null, error: sanitizedError };
    }
};
