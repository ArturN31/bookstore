import { AddToWishlistForm } from './add/AddToWishlistForm';
import { RemoveFromWishlistForm } from './remove/RemoveFromWishlistForm';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

export const BookWishlist = async ({
	wishlisted,
	bookID,
	wishlistedBooksAmount,
}: {
	wishlisted: boolean;
	bookID: string;
	wishlistedBooksAmount: number;
}) => {
	return (
		<div>
			{wishlistedBooksAmount <= 10 ? (
				wishlisted ? (
					<RemoveFromWishlistForm
						bookID={bookID}
						wishlistedBooksAmount={wishlistedBooksAmount}
					/>
				) : (
					<AddToWishlistForm
						bookID={bookID}
						wishlistedBooksAmount={wishlistedBooksAmount}
					/>
				)
			) : wishlisted ? (
				<RemoveFromWishlistForm
					bookID={bookID}
					wishlistedBooksAmount={wishlistedBooksAmount}
				/>
			) : (
				<button
					type='submit'
					className='hover:cursor-not-allowed'>
					<BookmarkBorderIcon />
				</button>
			)}
		</div>
	);
};
