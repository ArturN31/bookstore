'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserData, getUserDataProperty } from '@/data/user/GetUserData';

export type UsernameFormState = {
	username: string | null;
	validationErrors?: z.ZodIssue[];
	message?: string;
	error?: any;
	isUsernameTaken?: boolean;
};

const schema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters long')
		.max(50, 'Username cannot be longer than 50 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
		.trim(),
});

export async function UsernameFormUpdateAction(
	prevState: UsernameFormState | undefined,
	formData: FormData,
): Promise<UsernameFormState> {
	const username = formData.get('username') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			username: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
			isUsernameTaken: false,
		};

	const validatedData = schema.safeParse({
		username,
	});

	if (!validatedData.success) {
		return {
			username,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
			isUsernameTaken: false,
		};
	}

	const userID = await getUserDataProperty('id');

	if (!userID) {
		return {
			username,
			message: 'User not authenticated. Please log in again.',
			isUsernameTaken: false,
		};
	}

	const userData = await getUserData();

	if (userData?.username === username) {
		return {
			username,
			message: 'Provided username is the same as current one.',
			isUsernameTaken: false,
		};
	}

	const supabase = await createClient();

	const { error: supabaseError } = await supabase
		.from('users')
		.update({
			username: validatedData.data.username,
		})
		.eq('id', userID);

	if (supabaseError) {
		console.log('Username form update error:', supabaseError);

		if (supabaseError.message === 'duplicate key value violates unique constraint "users_username_key"')
			return {
				username,
				error: supabaseError,
				message: 'Failed to update username.',
				isUsernameTaken: true,
			};

		return {
			username,
			error: supabaseError,
			message: 'Failed to update username. Please try again later.',
			isUsernameTaken: false,
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
