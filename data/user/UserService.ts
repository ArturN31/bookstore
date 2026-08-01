'use server';

import { createBackendClient } from '@/utils/db/server';
import * as Repo from './UserRepository';
import { UserConstants, UserServiceLogPrefix } from './UserConstants';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const getUserData = async (): Promise<ActionResponse<User>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const authUser = authResult.data.user;
        const userID = authUser.id;
        const email = authUser.email;
        if (!userID || !email || !isValidUUID(userID))
            return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const profileResult = await withRetry(async () => {
            return await safeSupabaseQuery(
                async () => await Repo.fetchUserProfileById(supabase, userID),
            );
        });
        if (profileResult.error)
            return { data: null, error: sanitizeSupabaseError(profileResult.error) };

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
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const getUserWishlist = async (): Promise<ActionResponse<Wishlist[]>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID))
            return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const wishlistResult = await withRetry(async () => {
            return await safeSupabaseQuery(
                async () => await Repo.fetchWishlistByUserId(supabase, userID),
            );
        });
        if (wishlistResult.error)
            return { data: null, error: sanitizeSupabaseError(wishlistResult.error) };

        return {
            data: wishlistResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Wishlist System Error:`, err);
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};
