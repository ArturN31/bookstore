'use server';

import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';

export const getUserDataProperty = async (prop: keyof User) => {
	const supabase = await createClient();
	let {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) return null;
	if (!user) return null;
	return user[prop as keyof typeof user] as string;
};

export const getUserData = async () => {
	const supabase = await createClient();
	const userID = await getUserDataProperty('id');
	const { data, error } = await supabase.from('users').select('*').eq('id', userID).single();
	if (error?.details === 'The result contains 0 rows') return null;
	if (error) {
		console.log(error);
		return null;
	}
	return data as User;
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
