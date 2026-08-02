'use server';

import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import * as Repo from './UserRepository';
import { UserServiceLogPrefix } from './UserConstants';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError, APP_ERROR_MESSAGES } from '@/utils/errors/SupabaseErrorHandler';

type UserRow = Database['public']['Tables']['users']['Row'];
type WishlistRow = Database['public']['Tables']['wishlist']['Row'];

export interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const verifyUserSession = async (supabase: SupabaseClient<Database>): Promise<string | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
};

export const getUserData = async (): Promise<ActionResponse<UserRow & { email: string }>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const authUser = authResult.data.user;
        const userID = authUser.id;
        const email = authUser.email;
        if (!userID || !email || !isValidUUID(userID))
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const profileResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(
                async () => await Repo.fetchUserProfileById(supabase, userID),
            );
        });

        if (profileResult.error) {
            if (profileResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: null, error: null };
            return { data: null, error: sanitizeSupabaseError(profileResult.error) };
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
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const getUserWishlist = async (): Promise<ActionResponse<WishlistRow[]>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID))
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const wishlistResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(
                async () => await Repo.fetchWishlistByUserId(supabase, userID),
            );
        });

        if (wishlistResult.error) {
            if (wishlistResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: [], error: null };
            return { data: null, error: sanitizeSupabaseError(wishlistResult.error) };
        }

        return {
            data: wishlistResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Wishlist System Error:`, err);
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const updateUsername = async (newUsername: string): Promise<ActionResponse<UserRow[]>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID))
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const updateResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(
                async () => await Repo.updateUsername(supabase, userID, newUsername),
            );
        });
        if (updateResult.error)
            return { data: null, error: sanitizeSupabaseError(updateResult.error) };

        return {
            data: updateResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Update Username System Error:`, err);
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};
