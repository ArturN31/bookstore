'use server';

import { redirect } from 'next/navigation';
import { getUsersCartID, removeItemFromUsersCart } from '../cart/GetCartData';
import { getUserDataProperty } from '../user/GetUserData';
import { revalidatePath } from 'next/cache';

export async function CartFormRemove(formData: FormData) {
	//getting values from form fields
	const fields = {
		bookId: formData.get('book-id'),
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

		if (typeof removeItemRes === 'string') {
			revalidatePath(`/book/${bookId}`);
			redirect(`/book/${bookId}`);
		}
	}
}
