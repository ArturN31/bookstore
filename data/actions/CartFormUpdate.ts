'use server';

import { revalidatePath } from 'next/cache';
import { getUsersCartID, updateItemInUsersCart } from '../cart/GetCartData';
import { getUserDataProperty } from '../user/GetUserData';
import { redirect } from 'next/navigation';

export async function CartFormUpdate(formData: FormData) {
	//getting values from form fields
	const fields = {
		bookQuantity: formData.get('book-quantity'),
		bookId: formData.get('book-id'),
	};
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	let cart = await getUsersCartID(userID);

	if (cart && fields.bookId && fields.bookQuantity) {
		const bookId = fields.bookId as string;
		const bookQuantity = fields.bookQuantity as string;
		const updateItemRes = await updateItemInUsersCart(cart, bookId, parseInt(bookQuantity));

		console.log(updateItemRes);

		if (typeof updateItemRes === 'string') {
			revalidatePath(`/book/${bookId}`);
			redirect(`/book/${bookId}`);
		}
	}
}
