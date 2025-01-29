'use server';

import { z } from 'zod';
import { createClient } from '@/utils/db/server';

//setting zod schema for formData object
const schema = z.object({
	streetAddress: z.string().min(1, 'Street Address is required'),
	postcode: z.string().min(1, 'Postcode is required'),
	city: z.string().min(1, 'City is required'),
	country: z.string().min(1, 'Country is required'),
});

export async function AddressFormUpdateAction(prevState: any, formData: FormData) {
	//getting values from form fields
	const fields = {
		streetAddress: formData.get('streetAddress'),
		postcode: formData.get('postcode'),
		city: formData.get('city'),
		country: formData.get('country'),
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

	//zod validation successful
	const { streetAddress, postcode, city, country } = validatedData.data;
	const supabase = await createClient();
	const user = await supabase.auth.getUser();
	const userID = user.data.user?.id;

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
		console.log(error);
		return {
			...prevState,
			error: error,
			message: 'User data could not be updated.',
		};
	}

	return {
		message: 'User data was updated.',
	};
}
