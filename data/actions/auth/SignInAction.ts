'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserData } from '@/data/user/GetUserData';
import { signInSchema } from '@/data/schemas/authSchemas';

export type SignInFormState = {
    email: string | null;
    password: string | null;
    validationErrors?: z.core.$ZodIssue[];
    message?: string;
    error?: any;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    invalid_credentials: 'Sign in credentials not recognized.',
    user_not_found: 'User to which the request relates no longer exists.',
};

export async function SignInAction(
    prevState: SignInFormState | undefined,
    formData: FormData,
): Promise<SignInFormState> {
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>;

    if (rawData.reset)
        return {
            email: '',
            password: '',
            message: undefined,
            error: undefined,
            validationErrors: undefined,
        };

    const validated = signInSchema.safeParse(rawData);

    if (!validated.success)
        return {
            email: '',
            password: '',
            validationErrors: validated.error.issues,
            message: 'Please correct the errors below.',
        };

    const supabase = await createBackendClient();
    const { error: authError } = await supabase.auth.signInWithPassword(validated.data);

    if (authError)
        return {
            email: '',
            password: '',
            error: authError,
            message:
                AUTH_ERROR_MESSAGES[authError.code || ''] ||
                authError.message ||
                'Failed to sign in.',
        };

    const dbUser = await getUserData();

    revalidatePath('/', 'layout');

    if (!dbUser) redirect('/user/profile');

    const returnTo = rawData.returnTo;
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) redirect(returnTo);

    redirect('/');
}
