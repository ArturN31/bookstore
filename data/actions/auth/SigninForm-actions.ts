'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const schema = z.object({
	email: z.string().trim().min(1, 'Email is required'),
	password: z.string().trim().min(1, 'Password is required'),
});

export async function SigninFormAction(prevState: any, formData: FormData) {
	const email = formData.get('email') as string | null;
	const password = formData.get('password') as string | null;

	const validatedData = schema.safeParse({ email, password });

	if (!validatedData.success) {
		prevState = { email, password };
		return {
			...prevState,
			validatedData,
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: validatedData.data.email,
		password: validatedData.data.password,
	});

	if (error) {
		console.log('Signin error:', error);
		if (error.code === 'invalid_credentials') {
			return {
				email,
				password,
				error,
				message: 'Sign in credentials not recognized.',
			};
		}
		if (error.code === 'user_not_found') {
			return {
				email,
				password,
				error,
				message: 'User to which the request relates no longer exists.',
			};
		}
		return {
			email,
			password,
			error,
			message: 'Failed to sign in.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
