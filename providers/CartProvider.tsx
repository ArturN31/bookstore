'use client';

import {
	createContext,
	useContext,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { createClient } from '@/utils/db/client';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { PostgrestResponse } from '@supabase/supabase-js';
import { useUserState } from './UserProvider';

type CartProvider = {
	cartBooks: CartItem[];
	cartBooksAmount: number;
	cartItemsAmount: number;
	cartTotal: string;
	cartID: string | null;
	loading: boolean;
	cartError: string | null;
	refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartProvider>({
	cartBooks: [],
	cartBooksAmount: 0,
	cartItemsAmount: 0,
	cartTotal: '0',
	cartID: null,
	loading: false,
	cartError: null,
	refreshCart: async () => {},
});

const getUsersCartID = async (
	supabase: ReturnType<typeof createClient>,
	userID: string,
) => {
	let { data: shopping_carts, error }: PostgrestResponse<{ id: string }> = await supabase
		.from('shopping_carts')
		.select('id')
		.eq('user_id', userID);
	if (error) {
		if (error.message === `invalid input syntax for type uuid: "User not logged in."`)
			return null;
		console.log(error);
		return null;
	}
	return shopping_carts?.[0]?.id || null;
};

const getBooksAddedToCart = async (
	supabase: ReturnType<typeof createClient>,
	cartID: string,
) => {
	let {
		data,
		error,
	}: PostgrestResponse<{
		book_id: string;
		quantity: number;
		created_at: string;
	}> = await supabase
		.from('shopping_cart_items')
		.select('book_id, quantity, created_at')
		.eq('cart_id', cartID);
	if (error) {
		console.log('Error fetching cart item:', error);
		return null;
	}
	return data || null;
};

const getBooksDetails = async (
	supabase: ReturnType<typeof createClient>,
	bookIDs: string[],
) => {
	if (!bookIDs || bookIDs.length === 0) return null;
	let { data, error }: PostgrestResponse<Book> = await supabase
		.from('books')
		.select('*')
		.in('id', bookIDs);
	if (error) {
		console.log('Error fetching books for cart:', error);
		return null;
	}
	return data || null;
};

/**
 * Manages and provides shopping cart data to the application.
 *
 * This provider handles the entire lifecycle of a user's shopping cart, including:
 * - **Fetching Data:** It fetches the user's cart ID and the books within the cart from the Supabase database.
 * - **State Management:** It keeps track of the `cartBooks`, the total `cartBooksAmount`, `cartID`, `loading` status, and any potential `cartError`.
 * - **Real-time Synchronization:** It sets up a real-time subscription to the `shopping_cart_items` table in Supabase. This ensures that the cart data automatically updates across all components whenever a book is added or removed from the cart by the user.
 * - **Data Provision:** It exposes the current cart state and a `refreshCart` function to its children components through the React Context API.
 *
 * This provider should be used to wrap any component that needs access to the user's cart information.
 * You can access the provided values using the `useCartState` custom hook.
 *
 * Note: This provider depends on the `UserProvider` to determine the logged-in status of the user before fetching cart data.
 */
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
	const supabase = useMemo(() => createClient(), []);
	const [cartBooks, setCartBooks] = useState<CartItem[]>([]);
	const [cartID, setCartID] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [cartError, setCartError] = useState<string | null>(null);

	const { loggedIn } = useUserState();

	const fetchCartData = useCallback(async () => {
		if (!loggedIn) {
			setCartBooks([]);
			setLoading(false);
			setCartID(null);
			return;
		}

		const userID = await getUserDataProperty('id');
		if (!userID) {
			setCartError('Cannot determine the user.');
			setLoading(false);
			setCartBooks([]);
			setCartID(null);
			return;
		}

		const currentCartID = await getUsersCartID(supabase, userID);
		if (!currentCartID) {
			setCartError("Cannot determine user's cart");
			setLoading(false);
			setCartBooks([]);
			setCartID(null);
			return;
		}

		setCartID(currentCartID);

		try {
			const cartItems = await getBooksAddedToCart(supabase, currentCartID);
			if (!cartItems || cartItems.length === 0) {
				setCartBooks([]);
				return;
			}

			const bookIds = cartItems.map((item) => item.book_id);
			const booksDetails = await getBooksDetails(supabase, bookIds);

			if (!booksDetails) {
				setCartError('Cannot retrieve book details.');
				setCartBooks([]);
				return;
			}

			const updatedBooks = booksDetails.map((book) => {
				const foundItem = cartItems.find((item) => book.id === item.book_id);
				const quantity = foundItem ? foundItem.quantity : 0;
				book.created_at = foundItem?.created_at ?? '';
				return { ...book, quantity };
			});

			setCartError(null);
			setCartBooks(updatedBooks);
		} catch (err: any) {
			setCartError('Error fetching cart data');
			console.log('Error fetching cart data:', err);
		} finally {
			setLoading(false);
		}
	}, [loggedIn, supabase]);

	useEffect(() => {
		let subscription: any;
		let setupExecuted = false;

		const setupCartAndSubscription = async () => {
			if (setupExecuted) return;
			setupExecuted = true;

			const userID = await getUserDataProperty('id');
			const currentCartID = userID ? await getUsersCartID(supabase, userID) : null;

			if (currentCartID) {
				subscription = supabase
					.channel('shopping-cart-items-channel')
					.on(
						'postgres_changes',
						{
							event: '*',
							schema: 'public',
							table: 'shopping_cart_items',
							filter: `cart_id=eq.${currentCartID}`,
						},
						(payload) => {
							fetchCartData();
						},
					)
					.subscribe();
			}
		};

		fetchCartData();
		setupCartAndSubscription();

		return () => {
			if (subscription) {
				supabase.removeChannel(subscription);
			}
		};
	}, [loggedIn, supabase, fetchCartData]);

	const contextValue = useMemo(
		() => ({
			cartBooks,
			cartBooksAmount: cartBooks.length,
			cartItemsAmount: cartBooks.reduce((sum, book) => sum + book.quantity, 0),
			cartTotal: cartBooks
				.reduce((sum, book) => sum + book.quantity * parseFloat(book.price.slice(1)), 0)
				.toFixed(2),
			cartID,
			loading,
			cartError,
			refreshCart: fetchCartData,
		}),
		[cartBooks, cartID, loading, cartError, fetchCartData],
	);

	return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCartState = () => useContext(CartContext);
