'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const schema = z.object({
	email: z.string().trim().min(1, 'Email is required'),
	password: z.string().trim().min(1, 'Password is required'),
	cnfPassword: z.string().trim().min(1, 'Confirm Password is required'),
});

export async function SignupFormAction(prevState: any, formData: FormData) {
	const email = formData.get('email') as string | null;
	const password = formData.get('password') as string | null;
	const cnfPassword = formData.get('cnfPassword') as string | null;

	if (password !== cnfPassword) {
		prevState = { password, cnfPassword };
		return {
			...prevState,
			message: 'Password and Confirm Password do not match.',
		};
	}

	const validatedData = schema.safeParse({ email, password, cnfPassword });

	if (!validatedData.success) {
		prevState = { password, cnfPassword };
		return {
			...prevState,
			validatedData,
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email: validatedData.data.email,
		password: validatedData.data.password,
	});

	if (error) {
		console.log('Signup error:', error);
		if (error.code === 'email_exists') {
			return {
				email,
				password,
				cnfPassword,
				error,
				message: 'Failed to insert user into the database as email already exists.',
			};
		}
		if (error.code === 'user_already_exists') {
			return {
				email,
				password,
				cnfPassword,
				error,
				message: 'Failed to insert user into the database as it already exists.',
			};
		}
		if (error.code === 'weak_password') {
			return {
				email,
				password,
				cnfPassword,
				error,
				message:
					'Failed to insert user into the database as the password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
			};
		}
		return {
			email,
			password,
			cnfPassword,
			error,
			message: 'Failed to insert user into the database.',
		};
	}

	//return success
	revalidatePath('/user/profile');
	redirect('/user/profile');
}
