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

	if (!bookId) {
		console.log('Book ID is missing.');
		return;
	}

	if (!pathname) {
		console.log('Pathname is missing.');
		return;
	}

	let cartID = await getUsersCartID(userID);

	if (cartID) {
		const removeItemResult = await removeItemFromUsersCart(cartID, bookId);

		if (!removeItemResult) {
			console.log(`Failed to remove item ${bookId} from cart ${cartID}`);
			return;
		}

		revalidatePath(pathname);
		redirect(pathname);
	} else {
		console.log(`Could not retrieve cart ID for user ${userID}`);
		return;
	}
}
