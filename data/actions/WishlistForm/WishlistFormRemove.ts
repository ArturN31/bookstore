'use server';

import { getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const WishlistFormRemove = async (formData: FormData) => {
	const bookID = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log("User ID not found, can't remove from wishlist.");
		return;
	}

	if (!pathname) {
		console.log("User ID not found, can't remove from wishlist.");
		return;
	}

	const supabase = await createClient();
	const { error } = await supabase.from('wishlist').delete().eq('user_id', userID).eq('book_id', bookID);

	if (error) console.log('Error removing from wishlist:', error);

	revalidatePath(pathname);
	redirect(pathname);
};
