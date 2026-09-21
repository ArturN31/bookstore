import { revalidatePath } from 'next/cache';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { createBackendClient } from '@/utils/db/server';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import {
    recordSecurityAuditLog,
    SecurityAuditEventType,
} from '@/utils/security/securityAuditLogger';
import { PRIVACY_REVALIDATION_ROUTES } from './PrivacySettingsConstants';
import { UpdatePrivacySettingsPayload } from './PrivacySettingsRepository';

export interface AuthValidationResult {
    user: User | null;
    error: string | null;
}

export const generateShareToken = (): string => {
    return crypto.randomUUID();
};

export const verifyAuthorizedUser = async (
    targetUserId: string,
    actionAttempted: string,
    attemptedPayload?: UpdatePrivacySettingsPayload,
): Promise<AuthValidationResult> => {
    const supabase = await createBackendClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        await recordSecurityAuditLog('UNAUTHORIZED_ACCESS' as SecurityAuditEventType, null, {
            targetUserId,
            actionAttempted,
            reason: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER,
        });

        return {
            user: null,
            error: APP_ERROR_MESSAGES.UNAUTHORIZED_PRIVACY_UPDATE_ATTEMPT,
        };
    }

    if (user.id !== targetUserId) {
        await recordSecurityAuditLog('UNAUTHORIZED_ACCESS' as SecurityAuditEventType, user.id, {
            targetUserId,
            actionAttempted,
            attemptedPayload: attemptedPayload ? JSON.stringify(attemptedPayload) : undefined,
            reason: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        });

        return {
            user: null,
            error: APP_ERROR_MESSAGES.FORBIDDEN_PRIVACY_UPDATE_ATTEMPT,
        };
    }

    return { user, error: null };
};

export const revalidateUserPrivacyPaths = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    options: { includeReviewsAndPublicProfile?: boolean } = {},
): Promise<void> => {
    const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

    if (!userData?.username) return;

    const username = userData.username;

    revalidatePath(PRIVACY_REVALIDATION_ROUTES.PROFILE(username));
    revalidatePath(PRIVACY_REVALIDATION_ROUTES.WISHLIST(username));

    if (options.includeReviewsAndPublicProfile) {
        revalidatePath(PRIVACY_REVALIDATION_ROUTES.PUBLIC_PROFILE(username));
        revalidatePath(PRIVACY_REVALIDATION_ROUTES.REVIEWS(username));
    }
};
