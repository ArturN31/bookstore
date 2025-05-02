'use client';

import { useBookFilter } from '@/providers/BookFilterProvider';
import { BookCard } from './bookCard/BookCard';

export const BooksFiltering = ({
	books,
	type,
	loggedIn,
	profileExists,
}: {
	books: Book[];
	type: 'all' | 'wishlisted';
	loggedIn: boolean;
	profileExists: boolean;
}) => {
	//add wishlisted books to Book[]
	const wishlistedBooks = books.filter((book) => book.is_active && book.wishlisted);
	const wishlistedBooksAmount = wishlistedBooks.length;

	//add books in cart to Book[]
	const booksInCart = books.filter((book) => book.is_active && book.addedToCart);
	const booksInCartAmount = booksInCart.length;

	const filteredBooks = books.filter((book) => {
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

	const { filterType } = useBookFilter();
	console.log(filterType);

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
