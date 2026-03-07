'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { passwordSchema } from '@/data/schemas/authSchemas';

export type ChangePasswordFormState = {
    password: string | null;
    cnfPassword: string | null;
    validationErrors?: z.core.$ZodIssue[];
    message?: string;
    error?: any;
};

export async function ChangePasswordAction(
    prevState: ChangePasswordFormState | undefined,
    formData: FormData,
): Promise<ChangePasswordFormState> {
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>;

    if (rawData.reset)
        return {
            password: '',
            cnfPassword: '',
            message: undefined,
            error: undefined,
            validationErrors: undefined,
        };

    const validated = passwordSchema.safeParse(rawData);

    if (!validated.success)
        return {
            password: rawData.password || null,
            cnfPassword: rawData.cnfPassword || null,
            validationErrors: validated.error.issues,
            message: 'Please correct the errors below.',
        };

    const supabase = await createBackendClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
        return {
            password: rawData.password || null,
            cnfPassword: rawData.cnfPassword || null,
            message: 'Authentication failed. Please log in.',
        };

    const { error: supabaseError } = await supabase.auth.updateUser({
        password: validated.data.password,
    });

    if (supabaseError) {
        const isReauth = supabaseError.message.toLowerCase().includes('reauthentication');
        const isWeak = supabaseError.code === 'weak_password';

        return {
            password: rawData.password || null,
            cnfPassword: rawData.cnfPassword || null,
            error: supabaseError,
            message: isReauth
                ? 'Security timeout: Please sign out and back in to change your password.'
                : isWeak
                  ? 'Password is too weak.'
                  : supabaseError.message,
        };
    }

    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/user/auth/signin');
}
