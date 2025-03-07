'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';

//setting zod schema for formData object
const schema = z.object({
	streetAddress: z.string().min(1, 'Street Address is required'),
	postcode: z.string().min(1, 'Postcode is required'),
	city: z.string().min(1, 'City is required'),
	country: z.string().min(1, 'Country is required'),
});

export async function AddressFormUpdateAction(prevState: any, formData: FormData) {
	const streetAddress = formData.get('streetAddress') as string | null;
	const postcode = formData.get('postcode') as string | null;
	const city = formData.get('city') as string | null;
	const country = formData.get('country') as string | null;

	const validatedData = schema.safeParse({
		streetAddress,
		postcode,
		city,
		country,
	});

	if (!validatedData.success) {
		//zod validation failed
		prevState = {
			streetAddress,
			postcode,
			city,
			country,
		};
		return {
			...prevState,
			validatedData,
		};
	}

	const userID = await getUserDataProperty('id');

	if (!userID) {
		return {
			streetAddress,
			postcode,
			city,
			country,
			message: 'User not authenticated',
		};
	}

	const supabase = await createClient();
	const { error } = await supabase
		.from('users')
		.update({
			street_address: streetAddress,
			postcode: postcode,
			city: city,
			country: country,
		})
		.eq('id', userID);

	if (error) {
		console.log('Address form update error:', error);
		return {
			streetAddress,
			postcode,
			city,
			country,
			error,
			message: 'User data could not be updated.',
		};
	}

	revalidatePath('/user/profile');
	redirect('/user/profile');
}
