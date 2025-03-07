import { createClient } from '@/utils/db/server';
import { AddToWishlistButtons } from './AddToWishlistButtons';
import { revalidatePath } from 'next/cache';
import { getUserDataProperty } from '@/data/user/GetUserData';

export const AddToWishlistForm = ({
	bookID,
	wishlistedBooksAmount,
}: {
	bookID: string;
	wishlistedBooksAmount: number;
}) => {
	const AddToWishlist = async () => {
		'use server';
		const userID = await getUserDataProperty('id');

		if (!userID) {
			console.log("User ID not found, can't add to wishlist.");
			return;
		}

		const supabase = await createClient();
		const { error } = await supabase.from('wishlist').insert([
			{
				user_id: userID,
				book_id: bookID,
			},
		]);

		if (error) console.log('Error adding to wishlist:', error);
		revalidatePath('/');
	};

	return (
		<form
			id='add-to-wishlist-form'
			action={AddToWishlist}
			className='w-fit'>
			<AddToWishlistButtons wishlistedBooksAmount={wishlistedBooksAmount} />
		</form>
	);
};
