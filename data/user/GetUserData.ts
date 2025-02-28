'use server';

import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';

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

export const logout = async () => {
	try {
		const supabase = await createClient();
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.log(error);
			return false;
		}

		revalidatePath('/');
		return true;
	} catch (error) {
		console.log(error);
	}
};

export const isLoggedIn = async (userID: string | undefined) => {
	return typeof userID === 'string' && userID !== 'User not logged in.' ? true : false;
};
