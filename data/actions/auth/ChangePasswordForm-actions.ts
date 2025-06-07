'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';

export type UsernameFormState = {
	password: string | null;
	cnfPassword: string | null;
	validationErrors?: z.ZodIssue[];
	message?: string;
	error?: any;
};

const schema = z
	.object({
		password: z
			.string()
			.trim()
			.min(8, 'Password must be at least 8 characters long')
			.max(50, 'Password cannot be longer than 50 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
				'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
			),
		cnfPassword: z
			.string()
			.trim()
			.min(8, 'Password must be at least 8 characters long')
			.max(50, 'Password cannot be longer than 50 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
				'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
			),
	})
	.refine((data) => data.password === data.cnfPassword, {
		message: 'Passwords must match',
		path: ['cnfPassword'],
	});

export async function ChangePasswordFormAction(
	prevState: UsernameFormState | undefined,
	formData: FormData,
): Promise<UsernameFormState> {
	const password = formData.get('password') as string | null;
	const cnfPassword = formData.get('cnfPassword') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			password: '',
			cnfPassword: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
		};

	const validatedData = schema.safeParse({ password, cnfPassword });

	if (!validatedData.success) {
		return {
			password,
			cnfPassword,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
		};
	}

	const userID = await getUserDataProperty('id');

	if (!userID) {
		return {
			password,
			cnfPassword,
			message: 'User not authenticated. Please log in again.',
		};
	}

	const supabase = await createClient();
	const { error: supabaseError } = await supabase.auth.updateUser({ password: validatedData.data.password });

	if (supabaseError) {
		if (supabaseError.code === 'weak_password') {
			return {
				password,
				cnfPassword,
				error: supabaseError,
				message: 'Failed to update password.',
			};
		}
		return {
			password,
			cnfPassword,
			error: supabaseError,
			message: 'Failed to update username. Please try again later.',
		};
	}

	//return success
	await supabase.auth.signOut();
	revalidatePath('/user/profile');
	redirect('/user/profile');
}
