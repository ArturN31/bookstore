'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { signUpSchema } from '@/data/schemas/authSchemas';
import { registerUser } from './AuthRepository';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AUTH_ROUTES, AUTH_MESSAGES } from './AuthConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

export type SignUpFormState = {
    validationErrors?: z.ZodIssue[];
    message?: string | null;
};

const INITIAL_STATE: SignUpFormState = {
    message: null,
    validationErrors: undefined,
};

export async function SignUpAction(
    prevState: SignUpFormState | undefined,
    formData: FormData,
): Promise<SignUpFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_STATE;

    const validated = signUpSchema.safeParse(rawData);
    if (!validated.success)
        return {
            validationErrors: validated.error.issues,
            message: AUTH_MESSAGES.SIGN_UP_VALIDATION,
        };

    const captchaToken = rawData.captchaToken as string | undefined;
    const { email } = validated.data;

    if (!captchaToken) {
        void recordSecurityAuditLog('FAILED_REGISTRATION', null, {
            operation: 'SignUpAction_missing_captcha',
            email,
        });
        return { message: AUTH_MESSAGES.SIGN_UP_CAPTCHA_ERROR };
    }

    try {
        const supabase = await createBackendClient();

        const { error: authError } = await registerUser(supabase, {
            email: validated.data.email,
            password: validated.data.password,
            options: { captchaToken },
        });

        if (authError) {
            const sanitizedError = sanitizeSupabaseError(authError);

            void recordSecurityAuditLog('FAILED_REGISTRATION', null, {
                operation: 'SignUpAction_auth_failed',
                email,
                error: sanitizedError,
            });

            return { message: sanitizedError };
        }

        await recordSecurityAuditLog('SUCCESSFUL_REGISTRATION', null, {
            operation: 'SignUpAction_success',
            email,
        });

        revalidatePath(AUTH_ROUTES.ROOT, 'layout');
        revalidatePath(AUTH_ROUTES.PROFILE);
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;

        console.error('[SignUpAction] Critical Failure:', err);

        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: 'SignUpAction_critical_failure',
            email,
            error: sanitizeSupabaseError(err),
        });

        return { message: sanitizeSupabaseError(err) };
    }

    redirect(AUTH_ROUTES.PROFILE);
}
