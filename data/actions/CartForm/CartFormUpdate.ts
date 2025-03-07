'use server';

import { revalidatePath } from 'next/cache';
import { getUsersCartID, updateItemInUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { redirect } from 'next/navigation';

export async function CartFormUpdate(formData: FormData) {
	const bookQuantity = formData.get('book-quantity') as string | null;
	const bookId = formData.get('book-id') as string | null;
	const pathname = formData.get('pathname') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return;
	}

	let cartID = await getUsersCartID(userID);

	if (cartID && bookId && bookQuantity && pathname) {
		const parsedQuantity = parseInt(bookQuantity, 10);
		const updateItemResult = await updateItemInUsersCart(cartID, bookId, parsedQuantity);

		if (typeof updateItemResult === 'string') {
			revalidatePath(pathname);
			redirect(pathname);
		}
	}
}
