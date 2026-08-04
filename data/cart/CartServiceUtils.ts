import { createBackendClient } from '@/utils/db/server';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import * as Repo from './CartRepository';
import { UUID_REGEX } from './CartConstants';

type BackendClient = Awaited<ReturnType<typeof createBackendClient>>;

export const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

export const verifyUserSession = async (supabase: BackendClient): Promise<string | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
};

export async function executeCartAction<T>(
    operation: string,
    targetUserId: string | null,
    fn: (supabase: BackendClient) => Promise<{ data: T | null; error: unknown }>,
    requireUserMatch = true,
): Promise<{ data: T | null; error: string | null }> {
    if (targetUserId && !isValidUUID(targetUserId)) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: `${operation}_malformed_uuid`,
            targetUserId,
        });
        return { data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION };
    }

    try {
        return await withRetry(async () => {
            const supabase = await createBackendClient();
            const authenticatedId = await verifyUserSession(supabase);

            if (requireUserMatch && targetUserId && authenticatedId !== targetUserId) {
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
                    targetUserId,
                    operation: `${operation}_unauthorized_mismatch`,
                });
                throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
            }

            if (!requireUserMatch && !authenticatedId) {
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                    operation: `${operation}_unauthenticated`,
                });
                throw new Error(APP_ERROR_MESSAGES.UNAUTHENTICATED_USER);
            }

            const result = await safeSupabaseQuery(async () => await fn(supabase));
            if (result.error) {
                if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED) {
                    return { data: null, error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
                }
                const sanitizedError = sanitizeSupabaseError(result.error);
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', targetUserId, {
                    operation: `${operation}_db_error`,
                    error: sanitizedError,
                });
                return { data: null, error: sanitizedError };
            }

            return { data: result.data ?? null, error: null };
        });
    } catch (err: unknown) {
        const sanitizedError = sanitizeSupabaseError(err);
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', targetUserId, {
            operation: `${operation}_exception`,
            error: sanitizedError,
        });
        return { data: null, error: sanitizedError };
    }
}

export const CART_OPERATIONS: Record<
    string,
    (cartID: string, bookID: string, bookQuantity: number) => Promise<SafeQueryResult<boolean>>
> = {
    add: async (cartID, bookID, qty): Promise<SafeQueryResult<boolean>> => {
        const supabase = await createBackendClient();
        const result = await safeSupabaseQuery(
            async () => await Repo.upsertItem(supabase, cartID, bookID, qty),
        );
        return result as SafeQueryResult<boolean>;
    },
    update: async (cartID, bookID, qty): Promise<SafeQueryResult<boolean>> => {
        const supabase = await createBackendClient();
        const result = await safeSupabaseQuery(
            async () => await Repo.updateItem(supabase, cartID, bookID, qty),
        );
        return result as SafeQueryResult<boolean>;
    },
    remove: async (cartID, bookID, _qty): Promise<SafeQueryResult<boolean>> => {
        const supabase = await createBackendClient();
        const result = await safeSupabaseQuery(
            async () => await Repo.deleteItem(supabase, cartID, bookID),
        );
        return result as SafeQueryResult<boolean>;
    },
};
