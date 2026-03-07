'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signUpSchema } from '@/data/schemas/authSchemas';

export type SignUpFormState = {
    email: string | null;
    password: string | null;
    cnfPassword: string | null;
    validationErrors?: z.core.$ZodIssue[];
    message?: string;
    error?: any;
};

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
    email_exists: 'An account with this email already exists.',
    user_already_exists: 'An account with this email already exists.',
    weak_password: 'Password is too weak. Please ensure it meets all complexity requirements.',
};

export async function SignUpAction(
    prevState: SignUpFormState | undefined,
    formData: FormData,
): Promise<SignUpFormState> {
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>;

    if (rawData.reset)
        return {
            email: '',
            password: '',
            cnfPassword: '',
            message: undefined,
            error: undefined,
            validationErrors: undefined,
        };

    const validated = signUpSchema.safeParse(rawData);

    if (!validated.success)
        return {
            email: rawData.email || null,
            password: rawData.password || null,
            cnfPassword: rawData.cnfPassword || null,
            validationErrors: validated.error.issues,
            message: 'Please correct the errors below.',
        };

    const supabase = await createBackendClient();
    const { error: authError } = await supabase.auth.signUp({
        email: validated.data.email,
        password: validated.data.password,
    });

    if (authError)
        return {
            email: rawData.email || null,
            password: rawData.password || null,
            cnfPassword: rawData.cnfPassword || null,
            error: authError,
            message:
                SIGNUP_ERROR_MESSAGES[authError.code || ''] ||
                authError.message ||
                'Failed to create account.',
        };

    revalidatePath('/', 'layout');
    revalidatePath('/user/profile');

    redirect('/user/profile');
}
