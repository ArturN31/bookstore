'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';

export type AddressFormState = {
	streetAddress: string | null;
	postcode: string | null;
	city: string | null;
	country: string | null;
	validationErrors?: z.ZodIssue[];
	message?: string;
	error?: any;
};

//setting zod schema for formData object
const schema = z.object({
	streetAddress: z
		.string()
		.trim()
		.min(1, 'Street Address is required')
		.max(100, 'Street Address cannot exceed 100 characters'),
	postcode: z
		.string()
		.min(1, 'Postcode is required')
		.regex(/^[A-Za-z0-9]{3,10}$/, 'Postcode must be alphanumeric and between 3-10 characters'),
	city: z.string().trim().min(1, 'City is required').max(50, 'City cannot exceed 50 characters'),
	country: z.string().trim().min(1, 'Country is required').max(50, 'Country cannot exceed 50 characters'),
});

export async function AddressFormUpdateAction(
	prevState: AddressFormState | undefined,
	formData: FormData,
): Promise<AddressFormState> {
	const streetAddress = formData.get('streetAddress') as string | null;
	const postcode = formData.get('postcode') as string | null;
	const city = formData.get('city') as string | null;
	const country = formData.get('country') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			streetAddress: '',
			postcode: '',
			city: '',
			country: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
		};

	const validatedData = schema.safeParse({
		streetAddress,
		postcode,
		city,
		country,
	});

	if (!validatedData.success) {
		return {
			streetAddress,
			postcode,
			city,
			country,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
		};
	}

	const userID = await getUserDataProperty('id');

	if (!userID) {
		return {
			streetAddress,
			postcode,
			city,
			country,
			message: 'User not authenticated. Please log in again.',
		};
	}

	const supabase = await createClient();
	const { error: supabaseError } = await supabase
		.from('users')
		.update({
			street_address: streetAddress,
			postcode: postcode,
			city: city,
			country: country,
		})
		.eq('id', userID);

	if (supabaseError) {
		console.log('Address form update error:', supabaseError);

		return {
			streetAddress,
			postcode,
			city,
			country,
			error: supabaseError,
			message: 'Failed to update Address. Please try again later.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
