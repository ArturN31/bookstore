import { addReviewsToBooks, addUsersCartItemsToBooks, addUsersWishlistedBooks } from '@/data/books/utils';
import { BookCard } from './bookCard/BookCard';
import { getUserData, getUserDataProperty, isLoggedIn } from '@/data/user/GetUserData';

export const Books = async ({ books, type }: { books: Book[]; type: 'all' | 'wishlisted' }) => {
	//empty/invalid books
	if (!Array.isArray(books) || books.length === 0) return null;

	let booksOutput = [...books];
	try {
		booksOutput = await addReviewsToBooks(booksOutput);
		booksOutput = await addUsersWishlistedBooks(booksOutput);
		booksOutput = await addUsersCartItemsToBooks(booksOutput);
	} catch (error) {
		console.error('Error processing books:', error);
		//TODO: Handle the error (e.g., display an error message)
	}

	const userID = await getUserDataProperty('id');
	const loggedIn = userID ? await isLoggedIn(userID) : false;
	const userData = await getUserData();
	const profileExists = userData ? true : false;

	//add wishlisted books to Book[]
	const wishlistedBooks = booksOutput.filter((book) => book.is_active && book.wishlisted);
	const wishlistedBooksAmount = wishlistedBooks.length;

	//add books in cart to Book[]
	const booksInCart = booksOutput.filter((book) => book.is_active && book.addedToCart);
	const booksInCartAmount = booksInCart.length;

	const filteredBooks = booksOutput.filter((book) => {
		if (book.is_active) {
			if (type === 'wishlisted') {
				return book.wishlisted;
			}
			return true; //keep all active books for 'all' type
		}
		return false; //exclude inactive books
	});

	const bookCardParams = {
		loggedIn: loggedIn,
		profileExists: profileExists,
		wishlistedBooksAmount: wishlistedBooksAmount,
		booksInCartAmount: booksInCartAmount,
	};

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
			{filteredBooks.map((book) => (
				<BookCard
					key={book.id}
					book={book}
					bookCardParams={bookCardParams}
				/>
			))}
		</div>
	);
};
