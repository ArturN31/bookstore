'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import { signInSchema } from '@/data/schemas/authSchemas';
import { authenticateUser } from './AuthRepository';
import { mapAuthErrorToMessage } from './AuthErrorHandler';

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
            message: 'Please correct the highlighted errors.',
        };

    try {
        const supabase = await createBackendClient();

        const { error: authError } = await authenticateUser(supabase, validated.data);

        if (authError)
            return {
                message: mapAuthErrorToMessage(authError),
            };

        const { data: dbUser } = await getUserData();

        revalidatePath('/', 'layout');

        if (!dbUser) redirect('/user/profile');

        const returnTo = rawData.returnTo as string | undefined;
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) redirect(returnTo);
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;

        console.error('[SignInAction] Critical Failure:', err);
        return { message: 'A server error occurred during authentication.' };
    }

    redirect('/');
}
