'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { signUpSchema } from '@/data/schemas/authSchemas';
import { registerUser } from './AuthRepository';
import { mapAuthErrorToMessage } from './AuthErrorHandler';

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
            message: 'Please resolve the validation errors.',
        };

    try {
        const supabase = await createBackendClient();

        const { error: authError } = await registerUser(supabase, {
            email: validated.data.email,
            password: validated.data.password,
        });

        if (authError)
            return {
                message: mapAuthErrorToMessage(authError),
            };

        revalidatePath('/', 'layout');
        revalidatePath('/user/profile');
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;

        console.error('[SignUpAction] Critical Failure:', err);
        return { message: 'A server error occurred during registration.' };
    }

    redirect('/user/profile');
}
