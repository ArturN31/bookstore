'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type SigninFormState = {
	email: string | null;
	password: string | null;
	validationErrors?: z.ZodIssue[];
	message?: string;
	error?: any;
};

const schema = z.object({
	email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
	password: z.string().trim(),
});

export async function SigninFormAction(
	prevState: SigninFormState | undefined,
	formData: FormData,
): Promise<SigninFormState> {
	const email = formData.get('email') as string | null;
	const password = formData.get('password') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			email: '',
			password: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
		};

	const validatedData = schema.safeParse({ email, password });

	if (!validatedData.success) {
		return {
			email,
			password,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
		};
	}

	const supabase = await createClient();
	const { error: supabaseError } = await supabase.auth.signInWithPassword({
		email: validatedData.data.email,
		password: validatedData.data.password,
	});

	if (supabaseError) {
		console.log('Signin error:', supabaseError);
		if (supabaseError.code === 'invalid_credentials') {
			return {
				email,
				password,
				error: supabaseError,
				message: 'Sign in credentials not recognized.',
			};
		}
		if (supabaseError.code === 'user_not_found') {
			return {
				email,
				password,
				error: supabaseError,
				message: 'User to which the request relates no longer exists.',
			};
		}
		return {
			email,
			password,
			error: supabaseError,
			message: 'Failed to sign in.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
