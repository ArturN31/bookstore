'use server';

import { getUserDataProperty } from '@/data/user/GetUserData';
import {
	addItemToUsersCart,
	createUsersCart,
	getUsersCartID,
} from '@/data/cart/GetCartData';

export async function CartFormInsert(
	prevState: { success: boolean; message: string },
	formData: FormData,
) {
	const bookId = formData.get('book-id') as string | null;
	const bookQuantityStr = formData.get('book-quantity') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return { success: false, message: 'Could not retrieve users id.' };
	}

	if (!bookId) {
		console.log('Book ID is missing.');
		return { success: false, message: 'Book ID is missing.' };
	}

	if (!bookQuantityStr) {
		console.log('Book quantity is missing.');
		return { success: false, message: 'Book quantity is missing.' };
	}

	const bookQuantity = parseInt(bookQuantityStr, 10);
	if (isNaN(bookQuantity) || bookQuantity < 0) {
		console.log(`Invalid book quantity: ${bookQuantityStr}`);
		return { success: false, message: `Invalid book quantity: ${bookQuantityStr}` };
	}

	let cartID = await getUsersCartID(userID);
	if (!cartID) {
		const createCartResult = await createUsersCart(userID);
		if (createCartResult) cartID = await getUsersCartID(userID);
	} else {
		const addItemResult = await addItemToUsersCart(cartID, bookId, bookQuantity);
		if (!addItemResult) return { success: false, message: 'Error adding to cart.' };
	}

	return { success: true, message: 'Item added successfully.' };
}
