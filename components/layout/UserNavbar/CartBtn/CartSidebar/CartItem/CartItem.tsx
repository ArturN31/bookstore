import React from 'react';
import { CartItemContent } from './CartItemContent';
import { CartItemRemove } from './CartItemRemove';

export const CartItem = ({
	book,
	books,
	setBooks,
}: {
	book: Book;
	books: Book[];
	setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) => {
	return (
		<div className='bg-white py-3 px-4 border-b border-gray-200 flex items-center transition-transform duration-200 hover:bg-gray-50'>
			<CartItemRemove
				book={book}
				setBooks={setBooks}
			/>
			<CartItemContent
				book={book}
				books={books}
				setBooks={setBooks}
			/>
		</div>
	);
};
