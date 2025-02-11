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
	//getting values from form fields
	const fields = {
		email: formData.get('email'),
		password: formData.get('password'),
	};

	//validating passed fields
	const validatedData = schema.safeParse(fields);

	if (!validatedData.success) {
		//zod validation failed
		prevState = fields;
		return {
			...prevState,
			validatedData,
		};
	}

	//zod validation successful attempt to sign in
	const { email, password } = validatedData.data;
	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: email,
		password: password,
	});

	//handle errors
	if (error) {
		console.log(error);
		if (error.code == 'invalid_credentials')
			return {
				...prevState,
				error: error,
				message: 'Sign in credentials not recognised.',
			};
		if (error.code == 'user_not_found')
			return {
				...prevState,
				error: error,
				message: 'User to which the request relates no longer exists.',
			};

		return {
			...prevState,
			error: error,
			message: 'Failed to sign in.',
		};
	}

	//return success
	revalidatePath('/user/profile');
	redirect('/user/profile');
}
