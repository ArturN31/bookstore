'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { passwordSchema } from '@/data/schemas/authSchemas';
import { updateAccountPassword, terminateSession } from './AuthRepository';
import { mapAuthErrorToMessage } from './AuthErrorHandler';

export type ChangePasswordFormState = {
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
    success?: boolean;
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
            message: 'Validation failed. Please check the requirements.',
        };

    try {
        const supabase = await createBackendClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) return { message: 'Session expired. Please log in again.' };

        const { error: updateError } = await updateAccountPassword(
            supabase,
            validated.data.password,
        );

        if (updateError)
            return {
                message: mapAuthErrorToMessage(updateError),
            };

        await terminateSession(supabase);
    } catch (err) {
        console.error('[ChangePasswordAction] Critical Failure:', err);
        return { message: 'A server error occurred.' };
    }

    revalidatePath('/', 'layout');
    redirect('/user/auth/signin');
}
