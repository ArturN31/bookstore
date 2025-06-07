'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';

//setting zod schema for formData object
const schema = z.object({
	firstName: z.string().trim().min(1, 'First Name is required').max(50, 'First Name cannot exceed 50 characters'),
	lastName: z.string().trim().min(1, 'Last Name is required').max(50, 'Last Name cannot exceed 50 characters'),
	dob: z
		.string()
		.min(1, 'Date of Birth is required')
		.refine((value) => !isNaN(Date.parse(value)), { message: 'Date of Birth must be a valid date' }),
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
	phoneNumber: z
		.string()
		.trim()
		.min(1, 'Phone Number is required')
		.regex(
			/^\+?[0-9\s-]{7,20}$/,
			'Phone Number must be between 7-20 characters and contain only digits, spaces, hyphens, and an optional leading "+" for country code',
		),
});

export async function AddressFormInsertAction(prevState: any, formData: FormData) {
	const firstName = formData.get('firstName') as string | null;
	const lastName = formData.get('lastName') as string | null;
	const dob = formData.get('dob') as string | null;
	const streetAddress = formData.get('streetAddress') as string | null;
	const postcode = formData.get('postcode') as string | null;
	const city = formData.get('city') as string | null;
	const country = formData.get('country') as string | null;
	const phoneNumber = formData.get('phoneNumber') as string | null;
	const reset = formData.get('reset') as string | null;

	if (reset)
		return {
			firstName: '',
			lastName: '',
			dob: '',
			streetAddress: '',
			postcode: '',
			city: '',
			country: '',
			phoneNumber: '',
			message: undefined,
			error: undefined,
			validationErrors: undefined,
		};

	const validatedData = schema.safeParse({
		firstName,
		lastName,
		dob,
		streetAddress,
		postcode,
		city,
		country,
		phoneNumber,
	});

	if (!validatedData.success) {
		return {
			firstName,
			lastName,
			dob,
			streetAddress,
			postcode,
			city,
			country,
			phoneNumber,
			validationErrors: validatedData.error.issues,
			message: 'Please correct the errors below.',
		};
	}

	const userID = await getUserDataProperty('id');

	if (!userID) {
		return {
			firstName,
			lastName,
			dob,
			streetAddress,
			postcode,
			city,
			country,
			phoneNumber,
			message: 'User not authenticated. Please log in again.',
		};
	}

	const supabase = await createClient();
	const { error: supabaseError } = await supabase.from('users').insert({
		id: userID,
		first_name: validatedData.data.firstName,
		last_name: validatedData.data.lastName,
		date_of_birth: validatedData.data.dob,
		street_address: validatedData.data.streetAddress,
		postcode: validatedData.data.postcode,
		city: validatedData.data.city,
		country: validatedData.data.country,
		phone_number: validatedData.data.phoneNumber,
	});

	if (supabaseError) {
		console.error('Address form insert error:', supabaseError);
		return {
			firstName,
			lastName,
			dob,
			streetAddress,
			postcode,
			city,
			country,
			phoneNumber,
			error: supabaseError,
			message: 'User data could not be inserted into the database.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
