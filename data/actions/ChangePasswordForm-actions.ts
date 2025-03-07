'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const schema = z.object({
	password: z.string().trim().min(1, 'Password is required'),
	cnfPassword: z.string().trim().min(1, 'Confirm Password is required'),
});

export async function ChangePasswordFormAction(prevState: any, formData: FormData) {
	const password = formData.get('password') as string | null;
	const cnfPassword = formData.get('cnfPassword') as string | null;

	if (password !== cnfPassword) {
		prevState = { password, cnfPassword };
		return {
			...prevState,
			message: 'Password and Confirm Password do not match.',
		};
	}

	const validatedData = schema.safeParse({ password, cnfPassword });

	if (!validatedData.success) {
		prevState = { password, cnfPassword };
		return {
			...prevState,
			validatedData,
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.updateUser({ password: validatedData.data.password });

	if (error) {
		if (error.code === 'weak_password') {
			return {
				password,
				cnfPassword,
				error,
				message:
					'The password is too weak.\nPassword should be at least 8 characters long.\nIt has to include: lowercase, uppercase letters, digits, and symbols.',
			};
		}
		return {
			password,
			cnfPassword,
			error,
			message: 'Could not update user password.',
		};
	}

	//return success
	await supabase.auth.signOut();
	revalidatePath('/user/profile');
	redirect('/user/profile');
}
