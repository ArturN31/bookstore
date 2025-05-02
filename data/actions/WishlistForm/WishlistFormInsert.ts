'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/server';

export async function WishlistFormInsert(formData: FormData) {
	const bookID = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log("User ID not found, can't add to wishlist.");
		return;
	}

	if (!pathname) {
		console.log("User ID not found, can't add to wishlist.");
		return;
	}

	const supabase = await createClient();
	const { error } = await supabase.from('wishlist').insert([
		{
			user_id: userID,
			book_id: bookID,
		},
	]);

	if (error) console.log('Error adding to wishlist:', error);

	revalidatePath(pathname);
	redirect(pathname);
}
