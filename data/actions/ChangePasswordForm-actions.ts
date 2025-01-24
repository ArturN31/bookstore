'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';

const schema = z.object({
	password: z.string().trim().min(1, 'Password is required'),
	cnfPassword: z.string().trim().min(1, 'Confirm Password is required'),
});

export async function ChangePasswordFormAction(prevState: any, formData: FormData) {
	//getting values from form fields
	const fields = {
		password: formData.get('password'),
		cnfPassword: formData.get('cnfPassword'),
	};

	if (fields.password !== fields.cnfPassword) {
		//passwords do not match
		prevState = fields;
		return {
			...prevState,
			message: 'Password and Confirm Password do not match.',
		};
	}

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

	//zod validation successful attempt to change password
	const { password } = validatedData.data;
	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password: password });

	//handle errors
	if (error) {
		if (error.code == 'weak_password')
			return {
				...fields,
				error: error,
				message:
					'The password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
			};

		return {
			...prevState,
			error: error,
			message: 'Could not update users password.',
		};
	}

	//return success
	return { message: 'Password has been changed.' };
}
