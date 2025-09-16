'use server';

import { getUsersCartID, updateItemInUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';

export async function CartFormUpdate(
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

	const cartID = await getUsersCartID(userID);
	if (!cartID) {
		console.log(`Could not retrieve cart ID for user ${userID}`);
		return { success: false, message: `Could not retrieve cart ID for user.` };
	}

	const updateItemResult = await updateItemInUsersCart(cartID, bookId, bookQuantity);
	if (!updateItemResult) {
		console.log(`Failed to update item ${bookId} in cart ${cartID}`);
		return { success: false, message: 'Failed to update item in cart.' };
	}

	return { success: true, message: 'Quantity updated successfully.' };
}
