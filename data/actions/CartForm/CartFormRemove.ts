'use server';

import { redirect } from 'next/navigation';
import { getUsersCartID, removeItemFromUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { revalidatePath } from 'next/cache';

export async function CartFormRemove(formData: FormData) {
	//getting values from form fields
	const fields = {
		bookId: formData.get('book-id'),
		pathname: formData.get('pathname') as string,
	};
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	let cart = await getUsersCartID(userID);

	if (cart && fields.bookId) {
		const bookId = fields.bookId as string;
		const removeItemRes = await removeItemFromUsersCart(cart, bookId);

		if (typeof removeItemRes === 'string' && fields.pathname) {
			revalidatePath(fields.pathname);
			redirect(fields.pathname);
		}
	}
}
