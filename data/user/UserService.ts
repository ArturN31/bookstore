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
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const authUser = authResult.data.user;
        const userID = authUser.id;
        const email = authUser.email;

        if (!userID || !email || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID ?? null, {
                operation: 'getUserData_malformed_id',
                targetUserId: userID ?? null,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const authenticatedId = await verifyUserSession(supabase);
        if (authenticatedId !== userID) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                targetUserId: userID,
                operation: 'getUserData_unauthorized_mismatch',
            });
            return { data: null, error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
        }

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

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID ?? null, {
                operation: 'getUserWishlist_malformed_id',
                targetUserId: userID ?? null,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const authenticatedId = await verifyUserSession(supabase);
        if (authenticatedId !== userID) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                targetUserId: userID,
                operation: 'getUserWishlist_unauthorized_mismatch',
            });
            return { data: null, error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
        }

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

export const updateUsername = async (newUsername: string): Promise<ActionResponse<UserRow[]>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await Repo.fetchUserAuthData(supabase);
        if (authResult.error || !authResult.data?.user)
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

        const userID = authResult.data.user.id;
        if (!userID || !isValidUUID(userID)) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID ?? null, {
                operation: 'updateUsername_malformed_id',
                targetUserId: userID ?? null,
            });
            return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
        }

        const authenticatedId = await verifyUserSession(supabase);
        if (authenticatedId !== userID) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                targetUserId: userID,
                operation: 'updateUsername_unauthorized_mismatch',
            });
            return { data: null, error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
        }

        const updateResult = await withRetry<{ data: UserRow[] | null; error: string | null }>(
            async () => {
                const res = (await safeSupabaseQuery(
                    async () => await Repo.updateUsername(supabase, userID, newUsername),
                )) as unknown as { data: UserRow[] | null; error: unknown };

                if (res.error)
                    throw new Error(
                        typeof res.error === 'string' ? res.error : JSON.stringify(res.error),
                    );
                return { data: res.data ?? [], error: null };
            },
        );

        if (updateResult.error) {
            const sanitizedError = sanitizeSupabaseError(updateResult.error);
            return { data: null, error: sanitizedError };
        }

        return {
            data: updateResult.data || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error(`${UserServiceLogPrefix} Update Username System Error:`, err);
        const sanitizedError = sanitizeSupabaseError(err);
        return { data: null, error: sanitizedError };
    }
};
