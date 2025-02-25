import { AddToWishlistForm } from './add/AddToWishlistForm';
import { RemoveFromWishlistForm } from './remove/RemoveFromWishlistForm';

export const BookWishlist = async ({ wishlisted, bookID }: { wishlisted: boolean; bookID: string }) => {
	return <div>{wishlisted ? <RemoveFromWishlistForm bookID={bookID} /> : <AddToWishlistForm bookID={bookID} />}</div>;
};
