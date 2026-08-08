'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { passwordSchema } from '@/data/schemas/authSchemas';
import { updateAccountPassword, terminateSession } from './AuthRepository';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AUTH_ROUTES, AUTH_MESSAGES } from './AuthConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

export type ChangePasswordFormState = {
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
};

const INITIAL_STATE: ChangePasswordFormState = {
    message: null,
    validationErrors: undefined,
};

export async function ChangePasswordAction(
    prevState: ChangePasswordFormState | undefined,
    formData: FormData,
): Promise<ChangePasswordFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_STATE;

    const validated = passwordSchema.safeParse(rawData);
    if (!validated.success)
        return {
            validationErrors: validated.error.issues,
            message: AUTH_MESSAGES.CHANGE_PASSWORD_VALIDATION,
        };

    try {
        const supabase = await createBackendClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            void recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {
                operation: 'ChangePasswordAction_session_expired',
                error: authError ? sanitizeSupabaseError(authError) : 'No active user session',
            });
            return { message: AUTH_MESSAGES.SESSION_EXPIRED };
        }

        const { error: updateError } = await updateAccountPassword(
            supabase,
            validated.data.password,
        );
        if (updateError) {
            void recordSecurityAuditLog('PASSWORD_CHANGE', user.id, {
                operation: 'ChangePasswordAction_update_failed',
                error: updateError,
            });
            return { message: updateError };
        }

        void recordSecurityAuditLog('PASSWORD_CHANGE', user.id, {
            operation: 'ChangePasswordAction_success',
        });

        const { error: terminateError } = await terminateSession(supabase);
        if (terminateError) {
            void recordSecurityAuditLog('PASSWORD_CHANGE', user.id, {
                operation: 'ChangePasswordAction_terminate_failed',
                error: terminateError,
            });
            return { message: terminateError };
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
        console.error('[ChangePasswordAction] Critical Failure:', err);
        return { message: sanitizeSupabaseError(err) };
    }

    revalidatePath(AUTH_ROUTES.ROOT, 'layout');
    redirect(AUTH_ROUTES.SIGN_IN);
}
