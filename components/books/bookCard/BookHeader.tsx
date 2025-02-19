import { BookWishlist } from './wishlist/BookWishlist';
import { OutputBookRating } from './OutputBookRating';

export const BookHeader = ({
	loggedIn,
	wishlisted,
	bookID,
	reviews,
}: {
	loggedIn: boolean;
	wishlisted: boolean;
	bookID: string;
	reviews: Review[];
}) => {
	const bookRatingArray = reviews.map((review) => {
		return review.rating;
	});

	return (
		<div className='grid grid-cols-2 pb-1'>
			{loggedIn ? (
				<BookWishlist
					wishlisted={wishlisted}
					bookID={bookID}
				/>
			) : (
				<div></div>
			)}

			<OutputBookRating ratings={bookRatingArray} />
		</div>
	);
};
