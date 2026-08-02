'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { signUpSchema } from '@/data/schemas/authSchemas';
import { registerUser } from './AuthRepository';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AUTH_ROUTES, AUTH_MESSAGES } from './AuthConstants';

export type SignUpFormState = {
    validationErrors?: z.core.$ZodIssue[];
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
    if (!captchaToken) return { message: AUTH_MESSAGES.SIGN_UP_CAPTCHA_ERROR };

    try {
        const supabase = await createBackendClient();

        const { error: authError } = await registerUser(supabase, {
            email: validated.data.email,
            password: validated.data.password,
            options: { captchaToken },
        });
        if (authError) return { message: authError };

        revalidatePath(AUTH_ROUTES.ROOT, 'layout');
        revalidatePath(AUTH_ROUTES.PROFILE);
    } catch (err: unknown) {
        console.error('[SignUpAction] Critical Failure:', err);
        return { message: sanitizeSupabaseError(err) };
    }

    redirect(AUTH_ROUTES.PROFILE);
}
