'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/UserService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { updateUsername } from '../UserRepository';
import { USER_ROUTES } from '../UserConstants';
import { APP_ERROR_MESSAGES, DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

export type ChangeUsernameFormState = {
    username?: string | null;
    validationErrors?: z.ZodIssue[];
    message?: string | null;
    isUsernameTaken?: boolean;
};

const USERNAME_SCHEMA = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username cannot be longer than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
});

const INITIAL_STATE: ChangeUsernameFormState = {
    username: '',
    message: null,
    isUsernameTaken: false,
};

export async function ChangeUsernameAction(
    prevState: ChangeUsernameFormState | undefined,
    formData: FormData,
): Promise<ChangeUsernameFormState> {
    const rawUsername = formData.get('username') as string | null;
    const isReset = formData.get('reset') === 'true';

    if (isReset) return INITIAL_STATE;

    const validated = USERNAME_SCHEMA.safeParse({ username: rawUsername });

    if (!validated.success)
        return {
            username: rawUsername,
            validationErrors: validated.error.issues,
            message: APP_ERROR_MESSAGES.USERNAME_VALIDATION_ERROR,
        };

    const { username } = validated.data;

    try {
        const supabase = await createBackendClient();

        const { data: user, error: authError } = await getUserData();
        if (authError || !user) {
            const sanitizedAuthError = authError ? sanitizeSupabaseError(authError) : null;
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'ChangeUsernameAction_auth_failed',
                error: sanitizedAuthError || 'Session expired',
            });
            return {
                message: sanitizedAuthError || APP_ERROR_MESSAGES.SESSION_EXPIRED,
            };
        }

        if (user.username === username)
            return {
                username,
                message: APP_ERROR_MESSAGES.CURRENT_USERNAME,
            };

        const { error: dbError } = await updateUsername(supabase, user.id, username);

        if (dbError) {
            const errorMessage = sanitizeSupabaseError(dbError);
            const isTaken = errorMessage === DB_ERROR_MAP['23505'];
            if (!isTaken)
                void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', user.id, {
                    operation: 'ChangeUsernameAction_db_error',
                    error: errorMessage,
                });
            return {
                username,
                message: isTaken ? APP_ERROR_MESSAGES.USERNAME_TAKEN : errorMessage,
                isUsernameTaken: isTaken,
            };
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;

        const sanitizedError = sanitizeSupabaseError(err);
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: 'ChangeUsernameAction_exception',
            error: sanitizedError,
        });

        console.error('[ChangeUsernameAction] Pipeline Failure:', err);
        return {
            message: sanitizedError,
        };
    }

    revalidatePath(USER_ROUTES.PROFILE);
    redirect(USER_ROUTES.PROFILE);
}
