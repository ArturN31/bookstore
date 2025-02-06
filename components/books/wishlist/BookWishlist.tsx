import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';
import { AddToWishlistForm } from './add/AddToWishlistForm';
import { RemoveFromWishlistForm } from './add/RemoveFromWishlistForm';

export const BookWishlist = async ({ bookID }: { bookID: string }) => {
	const getUserID = async () => {
		'use server';

		const supabase = await createClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		return user?.id;
	};

	const isWishlisted = async (bookID: string) => {
		const supabase = await createClient();
		const { data, error }: PostgrestResponse<Wishlist> = await supabase
			.from('wishlist')
			.select('*')
			.eq('user_id', userID);

		const wishlisted = data?.filter((book) => {
			if (book.book_id === bookID) return book;
		});

		if (wishlisted && wishlisted.length > 0) return wishlisted as unknown as Wishlist;

		return undefined;
	};

	const userID = await getUserID();

	if (userID)
		return (
			<div>
				{(await isWishlisted(bookID)) ? (
					<RemoveFromWishlistForm bookID={bookID} />
				) : (
					<AddToWishlistForm bookID={bookID} />
				)}
			</div>
		);

	return <div></div>;
};
