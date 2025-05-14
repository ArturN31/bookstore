'use client';

import { useEffect, useState } from 'react';
import { CartBtn } from './CartBtn/CartBtn';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { createClient } from '@/utils/db/client';
import { PostgrestResponse } from '@supabase/supabase-js';
import { useUserState } from '@/providers/UserProvider';

const getUsersCartID = async (supabase: ReturnType<typeof createClient>, userID: string) => {
	let { data: shopping_carts, error }: PostgrestResponse<{ id: string }> = await supabase
		.from('shopping_carts')
		.select('id')
		.eq('user_id', userID);
	if (error) {
		if (error.message === `invalid input syntax for type uuid: "User not logged in."`) return null;
		console.log(error);
		return null;
	}
	return shopping_carts?.[0]?.id || null;
};

const getBooksAddedToCart = async (supabase: ReturnType<typeof createClient>, cartID: string) => {
	let {
		data,
		error,
	}: PostgrestResponse<{
		book_id: string;
		quantity: number;
	}> = await supabase.from('shopping_cart_items').select('book_id, quantity').eq('cart_id', cartID);
	if (error) {
		console.log('Error fetching cart item:', error);
		return null;
	}
	return data || null;
};

const getBooksDetails = async (supabase: ReturnType<typeof createClient>, bookIDs: string[]) => {
	if (!bookIDs || bookIDs.length === 0) return null;
	let { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').in('id', bookIDs);
	if (error) {
		console.log('Error fetching books for cart:', error);
		return null;
	}
	return data || null;
};

export const ClientCartManager = () => {
	const [books, setBooks] = useState<Book[]>([]);
	const supabase = createClient();
	const { loggedIn } = useUserState();

	const fetchCartData = async () => {
		if (!loggedIn) {
			setBooks([]);
			return;
		}

		try {
			const userID = await getUserDataProperty('id');
			if (!userID) {
				setBooks([]);
				return;
			}

			const cartID = await getUsersCartID(supabase, userID);
			if (!cartID) {
				setBooks([]);
				return;
			}

			const cartItems = await getBooksAddedToCart(supabase, cartID);
			if (!cartItems || cartItems.length === 0) {
				setBooks([]);
				return;
			}

			const bookIds = cartItems.map((item) => item.book_id);
			const booksDetails = await getBooksDetails(supabase, bookIds);

			if (!booksDetails) {
				setBooks([]);
				return;
			}

			const updatedBooks = booksDetails.map((book) => {
				const foundItem = cartItems.find((item) => book.id === item.book_id);
				const quantity = foundItem ? foundItem.quantity : 0;
				return { ...book, quantity };
			});
			setBooks(updatedBooks);
		} catch (err: any) {
			console.log('Error fetching cart data:', err);
		}
	};

	useEffect(() => {
		fetchCartData();
	}, [loggedIn]);

	useEffect(() => {
		let shoppingCartItems: any;

		if (loggedIn) {
			shoppingCartItems = supabase
				.channel('custom-all-channel')
				.on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_cart_items' }, (payload) => {
					fetchCartData();
				})
				.subscribe();
		}

		return () => {
			if (shoppingCartItems) {
				supabase.removeChannel(shoppingCartItems);
			}
		};
	}, [supabase, loggedIn]);

	return (
		<CartBtn
			books={books}
			setBooks={setBooks}
		/>
	);
};
