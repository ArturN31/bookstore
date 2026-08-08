import { createBackendClient } from '@/utils/db/server';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import * as Repo from './CartRepository';
import { UUID_REGEX } from './CartConstants';
import { revalidateTag } from 'next/cache';

type BackendClient = Awaited<ReturnType<typeof createBackendClient>>;

export type ActionResponse<T> = {
    data: T | null;
    error: string | null;
};

export const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

export const verifyUserSession = async (supabase: BackendClient): Promise<string | null> => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
};

export const handleItemMutation = async (
    operation: string,
    cartID: string,
    bookID: string,
    actionFn: (supabase: BackendClient) => Promise<{ data: boolean | null; error: unknown }>,
): Promise<ActionResponse<boolean>> => {
    if (!isValidUUID(cartID) || !isValidUUID(bookID))
        return { data: false, error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER };

    const result = await executeCartAction<boolean>(operation, null, actionFn, false);
    if (result.error) return { data: false, error: result.error };

    revalidateTag(`cart_${cartID}`, 'max');
    return { data: result.data, error: null };
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

    const supabase = await createBackendClient();
    const authenticatedId = await verifyUserSession(supabase);

    if (requireUserMatch && targetUserId && authenticatedId !== targetUserId) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
            targetUserId,
            operation: `${operation}_unauthorized_mismatch`,
        });
        return { data: null, error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
    }

    if (!requireUserMatch && !authenticatedId)
        return { data: null, error: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER };

    try {
        return await withRetry(async () => {
            const result = (await safeSupabaseQuery(async () => await fn(supabase))) as unknown as {
                data: T | null;
                error: unknown;
            };
            if (result.error) {
                if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                    return { data: null, error: APP_ERROR_MESSAGES.NO_DATA_RETURNED };
                throw new Error(
                    typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
                );
            }
            return { data: result.data ?? null, error: null };
        });
    } catch (err: unknown) {
        const sanitizedError = sanitizeSupabaseError(err);
        return { data: null, error: sanitizedError };
    }
}

export const CART_OPERATIONS: Record<
    string,
    (
        cartID: string,
        bookID: string,
        bookQuantity: number,
    ) => (supabase: BackendClient) => Promise<{ data: boolean | null; error: unknown }>
> = {
    add: (cartID, bookID, qty) => async (supabase: BackendClient) => {
        return await Repo.upsertItem(supabase, cartID, bookID, qty);
    },
    update: (cartID, bookID, qty) => async (supabase: BackendClient) => {
        return await Repo.updateItem(supabase, cartID, bookID, qty);
    },
    remove: (cartID, bookID, _qty) => async (supabase: BackendClient) => {
        return await Repo.deleteItem(supabase, cartID, bookID);
    },
};
