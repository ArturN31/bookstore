import { BookHeader } from './BookHeader';
import { BookBody } from './BookBody';

export const BookCard = ({ book, loggedIn }: { book: Book; loggedIn: boolean }) => {
	return (
		<div
			className='flex flex-col px-3 py-2 max-w-[300px] 
             sm:border-r sm:even:border-r-0 sm:last-of-type:border-r-0 
             md:border-r md:even:border-r md:nth-[3n]:border-r-0 
			 xl:not-last-of-type:border-r xl:nth-[4n]:border-r-0'>
			<BookHeader
				loggedIn={loggedIn}
				wishlisted={book.wishlisted}
				bookID={book.id}
				reviews={book.reviews}
				stock={book.stock_quantity}
			/>
			<BookBody book={book} />
		</div>
	);
};
