'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type SignUpFormState = {
	email: string | null;
	password: string | null;
	cnfPassword: string | null;
	validationErrors?: z.ZodIssue[];
	message?: string;
	error?: any;
};

const schema = z
	.object({
		email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
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
			.min(6, 'Confirm Password must be at least 6 characters long')
			.max(50, 'Confirm Password cannot be longer than 50 characters'),
	})
	.refine((data) => data.password === data.cnfPassword, {
		message: 'Passwords must match',
		path: ['cnfPassword'],
	});

export async function SignUpAction(
	prevState: SignUpFormState | undefined,
	formData: FormData,
): Promise<SignUpFormState> {
	const email = formData.get('email') as string | null;
	const password = formData.get('password') as string | null;
	const cnfPassword = formData.get('cnfPassword') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			email: '',
			password: '',
			cnfPassword: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
		};

	const validatedData = schema.safeParse({ email, password, cnfPassword });

	if (!validatedData.success) {
		return {
			email,
			password,
			cnfPassword,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
		};
	}

	const supabase = await createClient();
	const { error: supabaseError } = await supabase.auth.signUp({
		email: validatedData.data.email,
		password: validatedData.data.password,
	});

	if (supabaseError) {
		console.log('Signup error:', supabaseError);
		if (supabaseError.code === 'email_exists') {
			return {
				email,
				password,
				cnfPassword,
				error: supabaseError,
				message: 'Failed to insert user into the database as email already exists.',
			};
		}
		if (supabaseError.code === 'user_already_exists') {
			return {
				email,
				password,
				cnfPassword,
				error: supabaseError,
				message: 'Failed to insert user into the database as it already exists.',
			};
		}
		if (supabaseError.code === 'weak_password') {
			return {
				email,
				password,
				cnfPassword,
				error: supabaseError,
				message:
					'Failed to insert user into the database as the password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
			};
		}
		return {
			email,
			password,
			cnfPassword,
			error: supabaseError,
			message: 'Failed to insert user into the database.',
		};
	}

	//return success
	revalidatePath('/user/profile');
	redirect('/user/profile');
}
