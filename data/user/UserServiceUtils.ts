import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import * as Repo from './UserRepository';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

export interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

export const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const verifyUserSession = async (
    supabase: SupabaseClient<Database>,
): Promise<string | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
};

export const getAuthenticatedUserId = async (
    supabase: SupabaseClient<Database>,
    operationName: string,
): Promise<ActionResponse<string>> => {
    const authResult = await Repo.fetchUserAuthData(supabase);
    if (authResult.error || !authResult.data?.user)
        return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };

    const userID = authResult.data.user.id;
    if (!userID || !isValidUUID(userID)) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userID ?? null, {
            operation: `${operationName}_malformed_id`,
            targetUserId: userID ?? null,
        });
        return { data: null, error: APP_ERROR_MESSAGES.ERROR_AUTH_FAILED };
    }

    const authenticatedId = await verifyUserSession(supabase);
    if (authenticatedId !== userID) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', authenticatedId, {
            targetUserId: userID,
            operation: `${operationName}_unauthorized_mismatch`,
        });
        return { data: null, error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
    }

    return { data: userID, error: null };
};
