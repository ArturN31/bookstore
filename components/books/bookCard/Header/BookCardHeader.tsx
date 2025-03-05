import { BookWishlist } from './wishlist/BookWishlist';
import { OutputBookRating } from './BookRating';

export const BookCardHeader = ({
	bookCardHeaderParams,
}: {
	bookCardHeaderParams: {
		loggedIn: boolean;
		wishlisted: boolean;
		bookID: string;
		reviews: Review[];
		stock: number;
		profileExists: boolean;
		wishlistedBooksAmount: number;
	};
}) => {
	const { loggedIn, wishlisted, bookID, reviews, stock, profileExists, wishlistedBooksAmount } = bookCardHeaderParams;

	const bookRatingArray = reviews.map((review) => {
		return review.rating;
	});

	return (
		<div className={`grid ${stock <= 25 ? 'grid-cols-3' : 'grid-cols-2'} pb-1`}>
			{loggedIn && profileExists ? (
				<BookWishlist
					wishlisted={wishlisted}
					bookID={bookID}
					wishlistedBooksAmount={wishlistedBooksAmount}
				/>
			) : (
				<div></div>
			)}

			{stock <= 25 ? <p className='text-red-500 px-2 m-auto text-sm'>Low stock</p> : ''}

			<OutputBookRating ratings={bookRatingArray} />
		</div>
	);
};
