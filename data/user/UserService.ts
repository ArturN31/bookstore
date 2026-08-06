'use server';

import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import * as Repo from './UserRepository';
import { UserServiceLogPrefix } from './UserConstants';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

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
    let userID: string | null = null;
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user) {
            const sanitizedError = authResult.error
                ? sanitizeSupabaseError(authResult.error)
                : 'Auth failed';
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'getUserData_auth_failed',
                error: sanitizedError,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const authUser = authResult.data.user;
        userID = authUser.id;
        const email = authUser.email;
        if (!userID || !email || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'getUserData_malformed_id',
                targetUserId: userID,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const profileResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) {
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                    targetUserId: userID,
                    operation: 'getUserData_unauthorized_mismatch',
                });
                throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
            }

            return await safeSupabaseQuery(
                async () => await Repo.fetchUserProfileById(supabase, userID!),
            );
        });

        if (profileResult.error) {
            if (profileResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: null, error: null };

            const sanitizedError = sanitizeSupabaseError(profileResult.error);
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'getUserData_db_error',
                error: sanitizedError,
            });
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
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
            operation: 'getUserData_exception',
            error: sanitizedError,
        });
        return { data: null, error: sanitizedError };
    }
};

export const getUserWishlist = async (): Promise<ActionResponse<WishlistRow[]>> => {
    let userID: string | null = null;
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user) {
            const sanitizedError = authResult.error
                ? sanitizeSupabaseError(authResult.error)
                : 'Auth failed';
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'getUserWishlist_auth_failed',
                error: sanitizedError,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'getUserWishlist_malformed_id',
                targetUserId: userID,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const wishlistResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) {
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                    targetUserId: userID,
                    operation: 'getUserWishlist_unauthorized_mismatch',
                });
                throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
            }

            return await safeSupabaseQuery(
                async () => await Repo.fetchWishlistByUserId(supabase, userID!),
            );
        });

        if (wishlistResult.error) {
            if (wishlistResult.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: [], error: null };

            const sanitizedError = sanitizeSupabaseError(wishlistResult.error);
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'getUserWishlist_db_error',
                error: sanitizedError,
            });
            return { data: null, error: sanitizedError };
        }

        return {
            data: wishlistResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Wishlist System Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
            operation: 'getUserWishlist_exception',
            error: sanitizedError,
        });
        return { data: null, error: sanitizedError };
    }
};

export const updateUsername = async (newUsername: string): Promise<ActionResponse<UserRow[]>> => {
    let userID: string | null = null;
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user) {
            const sanitizedError = authResult.error
                ? sanitizeSupabaseError(authResult.error)
                : 'Auth failed';
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'updateUsername_auth_failed',
                error: sanitizedError,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'updateUsername_malformed_id',
                targetUserId: userID,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const updateResult = await withRetry(async () => {
            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) {
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                    targetUserId: userID,
                    operation: 'updateUsername_unauthorized_mismatch',
                });
                throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
            }

            return await safeSupabaseQuery(
                async () => await Repo.updateUsername(supabase, userID!, newUsername),
            );
        });

        if (updateResult.error) {
            const sanitizedError = sanitizeSupabaseError(updateResult.error);
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
                operation: 'updateUsername_db_error',
                newUsername,
                error: sanitizedError,
            });
            return { data: null, error: sanitizedError };
        }

        return {
            data: updateResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Update Username System Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID, {
            operation: 'updateUsername_exception',
            newUsername,
            error: sanitizedError,
        });
        return { data: null, error: sanitizedError };
    }
};
