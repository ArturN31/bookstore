'use client';

import { useEffect, useState } from 'react';
import { CartBtn } from './CartBtn/CartBtn';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/client';
import { PostgrestResponse } from '@supabase/supabase-js';

const getUsersCartID = async (userID: string) => {
	const supabase = await createClient();
	let { data: shopping_carts, error }: PostgrestResponse<{ id: string }> = await supabase
		.from('shopping_carts')
		.select('id')
		.eq('user_id', userID);
	if (error) {
		if (error.message === `invalid input syntax for type uuid: "User not logged in."`) return null;
		console.log(error);
		return null;
	}
	return shopping_carts && shopping_carts.length > 0 ? shopping_carts[0].id : null;
};

const getBooksAddedToCart = async (cartID: string) => {
	const supabase = await createClient();
	let {
		data,
		error,
	}: PostgrestResponse<{
		id: number;
		created_at: string;
		updated_at: string;
		cart_id: string;
		book_id: string;
		quantity: number;
	}> = await supabase.from('shopping_cart_items').select('*').eq('cart_id', cartID);
	if (error) {
		console.log('Error fetching cart item:', error);
		return null;
	}
	if (data && data.length > 0) {
		return data;
	} else {
		return null;
	}
};

const getBooksDetails = async (bookIDs: string[]) => {
	const supabase = await createClient();
	let { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').in('id', bookIDs);
	if (error) {
		console.log('Error fetching books for cart:', error);
		return null;
	}
	if (data && data.length > 0) {
		return data;
	} else {
		return null;
	}
};

export const ClientCartManager = () => {
	const [books, setBooks] = useState<Book[]>([]);
	const supabase = createClient();

	const fetchCartData = async () => {
		try {
			const userID = await getUserDataProperty('id');
			const cartID = userID ? await getUsersCartID(userID) : null;
			const booksAddedToCart = cartID ? await getBooksAddedToCart(cartID) : null;
			const bookIds = booksAddedToCart && booksAddedToCart.map((item: { book_id: string }) => item.book_id);
			const booksDetails = bookIds ? await getBooksDetails(bookIds) : null;

			if (booksAddedToCart && booksDetails) {
				const updatedBooks = booksDetails.map((book) => {
					const foundItem = booksAddedToCart.find((item: { book_id: string }) => book.id === item.book_id);
					const quantity = foundItem ? foundItem.quantity : 0;
					return { ...book, quantity };
				});
				setBooks(updatedBooks);
			} else {
				setBooks([]);
			}
		} catch (err: any) {
			console.log('Error fetching cart data:', err);
		}
	};

	useEffect(() => {
		fetchCartData();

		const shoppingCartItems = supabase
			.channel('custom-all-channel')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_cart_items' }, (payload) => {
				fetchCartData();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(shoppingCartItems);
		};
	}, []);

	return (
		<CartBtn
			books={books}
			setBooks={setBooks}
		/>
	);
};
