'use server';

import { revalidatePath } from 'next/cache';
import { getUsersCartID, updateItemInUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { redirect } from 'next/navigation';

export async function CartFormUpdate(formData: FormData): Promise<string | void> {
	const bookQuantityStr = formData.get('book-quantity') as string | null;
	const bookId = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	if (!bookId) {
		console.log('Book ID is missing.');
		return;
	}

	if (!bookQuantityStr) {
		console.log('Book quantity is missing.');
		return;
	}

	const bookQuantity = parseInt(bookQuantityStr, 10);
	if (isNaN(bookQuantity) || bookQuantity < 0) {
		console.log(`Invalid book quantity: ${bookQuantityStr}`);
		return;
	}

	if (!pathname) {
		console.log('Pathname is missing.');
		return;
	}

	const cartID = await getUsersCartID(userID);

	if (cartID) {
		const updateItemResult = await updateItemInUsersCart(cartID, bookId, bookQuantity);

		if (!updateItemResult) {
			console.log(`Failed to update item ${bookId} in cart ${cartID}`);
			return;
		}

		return;
	} else {
		console.log(`Could not retrieve cart ID for user ${userID}`);
		return;
	}
}
