import { SearchBar } from './SearchBar/SearchBar';
import { UserBtn } from './UserBtn/UserBtn';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { getBooksAddedToCart, getUsersCartID } from '@/data/cart/GetCartData';
import { getBooksInCart } from '@/data/books/GetBooksData';
import { ClientCartManager } from './ClientCartManager';

export const UserNavbar = async () => {
	const userID = await getUserDataProperty('id');
	const cartID = userID ? await getUsersCartID(userID) : null;
	const booksAddedToCart = cartID ? await getBooksAddedToCart(cartID) : null;
	const bookIds = booksAddedToCart?.map((book) => book.book_id);
	const booksInCart = bookIds ? await getBooksInCart(bookIds) : null;
	let books: { id: string; title: string; price: string; image_url: string; quantity: number }[] = [];

	if (booksInCart) {
		books = booksInCart?.map((book) => {
			const foundItem = booksAddedToCart?.find((b) => book.id === b.book_id);
			const quantity = foundItem ? foundItem.quantity : 0;
			return {
				id: book.id,
				title: book.title,
				price: book.price,
				image_url: book.image_url,
				quantity: quantity,
			};
		});
	}

	return (
		<div className='grid gap-3 sm:auto-cols-auto sm:grid-flow-col grid-cols-1'>
			<SearchBar />
			<div className='flex gap-3 justify-center'>
				<ClientCartManager />
				<UserBtn />
			</div>
		</div>
	);
};
