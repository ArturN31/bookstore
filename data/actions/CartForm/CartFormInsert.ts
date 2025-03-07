'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { addItemToUsersCart, createUsersCart, getUsersCartID } from '@/data/cart/GetCartData';

export async function CartFormInsert(formData: FormData) {
	const bookQuantity = formData.get('book-quantity') as string | null;
	const bookId = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	let cartID = await getUsersCartID(userID);

	if (!cartID) {
		const createCartResult = await createUsersCart(userID);
		if (typeof createCartResult === 'string') cartID = await getUsersCartID(userID);
	}

	if (cartID && bookId && bookQuantity && pathname) {
		const parsedQuantity = parseInt(bookQuantity, 10);
		const addItemResult = await addItemToUsersCart(cartID, bookId, parsedQuantity);

		if (typeof addItemResult === 'string') {
			revalidatePath(pathname);
			redirect(pathname);
		}
	}
}
