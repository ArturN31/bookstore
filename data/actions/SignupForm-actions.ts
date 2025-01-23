'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';

const schema = z.object({
	email: z.string().trim().min(1, 'Email is required'),
	password: z.string().trim().min(1, 'Password is required'),
	cnfPassword: z.string().trim().min(1, 'Confirm Password is required'),
});

export async function SignupFormAction(prevState: any, formData: FormData) {
	//getting values from form fields
	const fields = {
		email: formData.get('email'),
		password: formData.get('password'),
		cnfPassword: formData.get('cnfPassword'),
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

	if (fields.password !== fields.cnfPassword) {
		//passwords do not match
		prevState = fields;
		return {
			...prevState,
			message: 'Password and Confirm Password do not match.',
		};
	}

	//zod and custom validation successful - attempt to sign up
	const { email, password } = validatedData.data;
	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({ email: email, password: password });

	//handle errors
	if (error) {
		if (error.code == 'email_exists')
			return {
				...prevState,
				error: error,
				message: 'Failed to insert user into the database as email already exists.',
			};
		if (error.code == 'user_already_exists')
			return {
				...fields,
				error: error,
				message: 'Failed to insert user into the database as it already exists.',
			};
		if (error.code == 'weak_password')
			return {
				...fields,
				error: error,
				message:
					'Failed to insert user into the database as the password is too weak.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
			};

		return {
			...prevState,
			error: error,
			message: 'Failed to insert user into the database.',
		};
	}

	//return success
	return { message: 'User has been added to the database.' };
}
