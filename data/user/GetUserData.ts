'use server';

import { createClient } from '@/utils/db/server';

export const getUserDataProperty = async (prop: keyof User) => {
	try {
		const supabase = await createClient();
		let {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		if (error) return 'User not logged in.';
		if (user) return user[prop as keyof typeof user] as string;
	} catch (error) {
		console.log(error);
	}
};

export const getUserData = async () => {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', await getUserDataProperty('id'))
			.single();
		if (error) return 'User not logged in.';
		return data as User;
	} catch (error) {
		console.log(error);
	}
};
