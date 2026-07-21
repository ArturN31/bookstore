'use server';

import { createBackendClient } from '@/utils/db/server';
import { fetchUserProfileById, fetchWishlistByUserId, fetchUserAuthData } from './UserRepository';
import { UserConstants, UserServiceLogPrefix } from './UserConstants';
import { withRetry } from '@/utils/network/retry';

type UserDataResponse = {
    data: {
        user: UserDB | null;
        email: string | null;
    };
    error: string | null;
};

const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const getUserData = async (): Promise<ActionResponse<User>> => {
    try {
        const result = await withRetry(async (): Promise<UserDataResponse> => {
            const supabase = await createBackendClient();
            const userAuth = await fetchUserAuthData(supabase);

            if (!userAuth.data)
                return {
                    data: { user: null, email: null },
                    error: UserConstants.ERROR_AUTH_FAILED,
                };

            const { userID, email } = userAuth.data;

            if (!userID || !email || !isValidUUID(userID))
                return {
                    data: { user: null, email: null },
                    error: UserConstants.ERROR_AUTH_FAILED,
                };

            const userProfile = await fetchUserProfileById(supabase, userID);
            const { data, error } = userProfile;

            if (error)
                return {
                    data: { user: null, email: null },
                    error: UserConstants.ERROR_DATABASE_QUERY_FAILED,
                };

            if (!data)
                return {
                    data: { user: null, email: null },
                    error: UserConstants.ERROR_PROFILE_NOT_FOUND,
                };

            return {
                data: {
                    user: data,
                    email: email,
                },
                error: null,
            };
        });

        const {
            data: { user, email },
            error,
        } = result;

        if (!user || !email)
            return {
                data: null,
                error: error,
            };

        return {
            data: {
                ...user,
                email: email,
            },
            error: error,
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`${UserServiceLogPrefix} Unexpected Error:`, errorMessage);
        return { data: null, error: UserConstants.ERROR_SYSTEM_ERROR };
    }
};

export const getUserWishlist = async (): Promise<ActionResponse<Wishlist[]>> => {
    try {
        const supabase = await createBackendClient();

        const userAuth = await fetchUserAuthData(supabase);
        if (!userAuth.data || !userAuth.data.userID)
            return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const { userID } = userAuth.data;

        if (!isValidUUID(userID)) return { data: null, error: UserConstants.ERROR_AUTH_FAILED };

        const result = await fetchWishlistByUserId(supabase, userID);
        const { data, error } = result;

        if (error || !data) return { data: null, error: UserConstants.ERROR_WISHLIST_FETCH_FAILED };

        return {
            data: data,
            error: null,
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`${UserServiceLogPrefix} Wishlist System Error:`, errorMessage);
        return { data: null, error: UserConstants.ERROR_WISHLIST_SYSTEM_ERROR };
    }
};
