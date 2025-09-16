'use server';

import { getUsersCartID, removeItemFromUsersCart } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';

export async function CartFormRemove(
	prevState: { success: boolean; message: string },
	formData: FormData,
) {
	const bookId = formData.get('book-id') as string | null;
	const userID = await getUserDataProperty('id');

	if (!userID) {
		console.log('Could not retrieve users id.');
		return { success: false, message: 'Could not retrieve users id.' };
	}

	if (!bookId) {
		console.log('Book ID is missing.');
		return { success: false, message: 'Book ID is missing.' };
	}

	let cartID = await getUsersCartID(userID);
	if (!cartID) {
		console.log(`Could not retrieve cart ID for user ${userID}`);
		return { success: false, message: 'Could not retrieve cart ID for user' };
	}

	const removeItemResult = await removeItemFromUsersCart(cartID, bookId);
	if (!removeItemResult) {
		console.log(`Failed to remove item ${bookId} from cart ${cartID}`);
		return {
			success: false,
			message: `Failed to remove item from cart.`,
		};
	}

	return { success: true, message: 'Item removed successfully.' };
}
