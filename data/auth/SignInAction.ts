'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/UserService';
import { signInSchema } from '@/data/schemas/authSchemas';
import { authenticateUser } from './AuthRepository';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AUTH_ROUTES, AUTH_MESSAGES } from './AuthConstants';

export type SignInFormState = {
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
};

const INITIAL_STATE: SignInFormState = {
    message: null,
    validationErrors: undefined,
};

export async function SignInAction(
    prevState: SignInFormState | undefined,
    formData: FormData,
): Promise<SignInFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_STATE;

    const validated = signInSchema.safeParse(rawData);
    if (!validated.success)
        return {
            validationErrors: validated.error.issues,
            message: AUTH_MESSAGES.SIGN_IN_VALIDATION,
        };

    const captchaToken = rawData.captchaToken as string | undefined;
    if (!captchaToken) return { message: AUTH_MESSAGES.SIGN_IN_CAPTCHA_ERROR };

    let destinationUrl: string = AUTH_ROUTES.ROOT;

    try {
        const supabase = await createBackendClient();

        const { error: authError } = await authenticateUser(supabase, {
            ...validated.data,
            options: { captchaToken },
        });
        if (authError) return { message: authError };

        const { data: dbUser } = await getUserData();

        revalidatePath(AUTH_ROUTES.ROOT, 'layout');

        if (!dbUser) destinationUrl = AUTH_ROUTES.PROFILE;
        else {
            const returnTo = rawData.returnTo as string | undefined;
            if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//'))
                destinationUrl = returnTo;
        }
    } catch (err: unknown) {
        console.error('[SignInAction] Critical Failure:', err);
        return { message: sanitizeSupabaseError(err) };
    }

    redirect(destinationUrl);
}
