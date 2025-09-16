'use client';

import { useBookFilter } from '@/providers/BookFilterProvider';
import { BookCard } from './bookCard/BookCard';
import { sortBooks } from '@/data/books/BookSortBy';

export const BooksFiltering = ({
	books,
	type,
}: {
	books: Book[];
	type: 'all' | 'wishlisted';
}) => {
	//add wishlisted books to Book[]
	const wishlistedBooks = books.filter((book) => book.is_active && book.wishlisted);
	const wishlistedBooksAmount = wishlistedBooks.length;

	const filteredBooks = books.filter((book) => {
		if (book.is_active && book.stock_quantity != 0) {
			if (type === 'wishlisted') {
				return book.wishlisted;
			}
			return true; //keep all active books
		}
		return false; //exclude inactive books
	});

	//accessing sort by context
	const { filterType } = useBookFilter();
	const sortedBooks = sortBooks(filteredBooks, filterType);

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
			{sortedBooks?.map((book) => (
				<BookCard
					key={book.id}
					book={book}
					wishlistedBooksAmount={wishlistedBooksAmount}
				/>
			))}
		</div>
	);
};
