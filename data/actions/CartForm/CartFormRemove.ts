'use server';

import { redirect } from 'next/navigation';
import { getUsersCartID, removeItemFromUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { revalidatePath } from 'next/cache';

export async function CartFormRemove(formData: FormData) {
	const bookId = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	let cartID = await getUsersCartID(userID);

	if (cartID && bookId && pathname) {
		const removeItemResult = await removeItemFromUsersCart(cartID, bookId);

		if (typeof removeItemResult === 'string') {
			revalidatePath(pathname);
			redirect(pathname);
		}
	}
}
