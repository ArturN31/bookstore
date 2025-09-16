import { BookWishlist } from './wishlist/BookWishlist';
import { BookRating } from './BookRating';
import { useUserState } from '@/providers/UserProvider';
import { Chip } from '@mui/material';

export const BookCardHeader = ({
	bookCardHeaderParams,
}: {
	bookCardHeaderParams: {
		wishlisted: boolean;
		bookID: string;
		reviews: Review[];
		stock: number;
		wishlistedBooksAmount: number;
	};
}) => {
	const { wishlisted, bookID, reviews, stock, wishlistedBooksAmount } =
		bookCardHeaderParams;
	const { loggedIn, profileExists } = useUserState();

	return (
		<div className={`grid ${stock <= 25 ? 'grid-cols-3' : 'grid-cols-2'} pb-1`}>
			{loggedIn && profileExists && (
				<BookWishlist
					wishlisted={wishlisted}
					bookID={bookID}
					wishlistedBooksAmount={wishlistedBooksAmount}
				/>
			)}

			{stock <= 25 && (
				<Chip
					label={`${stock} left`}
					color='error'
					size='small'
					sx={{
						width: 'fit-content',
						display: 'grid',
						placeSelf: 'center',
						padding: '2px',
					}}
				/>
			)}

			<BookRating reviews={reviews} />
		</div>
	);
};
