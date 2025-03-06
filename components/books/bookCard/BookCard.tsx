import { BookCardHeader } from './Header/BookCardHeader';
import { BookCardBody } from './Body/BookCardBody';

export const BookCard = async ({
	book,
	bookCardParams,
}: {
	book: Book;
	bookCardParams: {
		loggedIn: boolean;
		profileExists: boolean;
		wishlistedBooksAmount: number;
		booksInCartAmount: number;
	};
}) => {
	const { loggedIn, profileExists, wishlistedBooksAmount, booksInCartAmount } = bookCardParams;
	const bookCardHeaderParams = {
		loggedIn: loggedIn,
		profileExists: profileExists,
		wishlisted: book.wishlisted,
		bookID: book.id,
		reviews: book.reviews,
		stock: book.stock_quantity,
		wishlistedBooksAmount: wishlistedBooksAmount,
	};

	return (
		<div
			className='flex flex-col px-3 py-2 max-w-[300px] 
             sm:border-r sm:even:border-r-0 sm:last-of-type:border-r-0 
             md:border-r md:even:border-r md:nth-[3n]:border-r-0 
			 xl:not-last-of-type:border-r xl:nth-[4n]:border-r-0'>
			<BookCardHeader bookCardHeaderParams={bookCardHeaderParams} />
			<BookCardBody
				book={book}
				loggedIn={loggedIn}
				profileExists={profileExists}
				booksInCartAmount={booksInCartAmount}
			/>
		</div>
	);
};
