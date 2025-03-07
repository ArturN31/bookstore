'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';

//setting zod schema for formData object
const schema = z.object({
	firstName: z.string().trim().min(1, 'First Name is required'),
	lastName: z.string().trim().min(1, 'Last Name is required'),
	dob: z.string().min(1, 'Date of Birth is required'),
	streetAddress: z.string().min(1, 'Street Address is required'),
	postcode: z.string().min(1, 'Postcode is required'),
	city: z.string().min(1, 'City is required'),
	country: z.string().min(1, 'Country is required'),
	phoneNumber: z.string().trim().min(1, 'Phone Number is required'),
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
		prevState = {
			firstName,
			lastName,
			dob,
			streetAddress,
			postcode,
			city,
			country,
			phoneNumber,
		};
		return {
			...prevState,
			validatedData,
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
			message: 'User not authenticated',
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.from('users').insert({
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

	if (error) {
		console.error('Address form insert error:', error);
		return {
			firstName,
			lastName,
			dob,
			streetAddress,
			postcode,
			city,
			country,
			phoneNumber,
			error,
			message: 'User data could not be inserted into the database.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
