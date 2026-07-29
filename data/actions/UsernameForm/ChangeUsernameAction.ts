'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/UserService';
import { updateUsername } from './UsernameRepository';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export type ChangeUsernameFormState = {
    username?: string | null;
    validationErrors?: z.ZodIssue[];
    message?: string | null;
    isUsernameTaken?: boolean;
};

const USERNAME_SCHEMA = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username cannot be longer than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
});

const INITIAL_STATE: ChangeUsernameFormState = {
    username: '',
    message: null,
    isUsernameTaken: false,
};

export async function ChangeUsernameAction(
    prevState: ChangeUsernameFormState | undefined,
    formData: FormData,
): Promise<ChangeUsernameFormState> {
    const rawUsername = formData.get('username') as string | null;
    const isReset = formData.get('reset') === 'true';

    if (isReset) return INITIAL_STATE;

    const validated = USERNAME_SCHEMA.safeParse({ username: rawUsername });
    if (!validated.success)
        return {
            username: rawUsername,
            validationErrors: validated.error.issues,
            message: 'Please resolve the validation errors.',
        };

    const { username } = validated.data;

    try {
        const supabase = await createBackendClient();

        const { data: user, error: authError } = await getUserData();
        if (authError || !user)
            return {
                message:
                    sanitizeSupabaseError(authError) || 'Session expired. Please log in again.',
            };

        if (user.username === username)
            return {
                username,
                message: 'This is already your current username.',
            };

        const { error: dbError } = await updateUsername(supabase, user.id, username);

        if (dbError) {
            const isTaken = dbError === 'This record already exists. Please use a different value.';
            return {
                username,
                message: isTaken ? 'This username is already taken.' : dbError,
                isUsernameTaken: isTaken,
            };
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;

        console.error('[ChangeUsernameAction] Pipeline Failure:', err);
        return {
            message: sanitizeSupabaseError(err),
        };
    }

    revalidatePath('/user/profile');
    redirect('/user/profile');
}
