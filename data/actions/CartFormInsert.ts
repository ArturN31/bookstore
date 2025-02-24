'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserDataProperty } from '../user/GetUserData';
import { addItemToUsersCart, createUsersCart, getUsersCartID } from '../cart/GetCartData';

export async function CartFormInsert(formData: FormData) {
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

	//check if shopping cart exists in shopping_carts table
	let cart = await getUsersCartID(userID);

	//cart does not exist
	if (cart === null) {
		let createCartRes = await createUsersCart(userID);
		if (typeof createCartRes === 'string') cart = await getUsersCartID(userID);
	}

	//cart exists
	//add passed book to shopping_cart_items table
	if (cart && fields.bookId && fields.bookQuantity) {
		const bookId = fields.bookId as string;
		const bookQuantity = fields.bookQuantity as string;
		const addItemRes = await addItemToUsersCart(cart, bookId, parseInt(bookQuantity));

		if (typeof addItemRes === 'string') {
			revalidatePath(`/book/${bookId}`);
			redirect(`/book/${bookId}`);
		}
	}
}
