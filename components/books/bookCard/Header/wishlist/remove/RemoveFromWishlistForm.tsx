import { createClient } from '@/utils/db/server';
import { RemoveFromWishlistButtons } from './RemoveFromWishlistButtons';
import { revalidatePath } from 'next/cache';

export const RemoveFromWishlistForm = ({
	bookID,
	wishlistedBooksAmount,
}: {
	bookID: string;
	wishlistedBooksAmount: number;
}) => {
	const RemoveFromWishlist = async () => {
		'use server';

		const supabase = await createClient();
		const { error } = await supabase.from('wishlist').delete().eq('book_id', bookID);

		if (error) console.log(error);
		revalidatePath('/');
	};

	return (
		<form
			id='remove-from-wishlist-form'
			action={RemoveFromWishlist}
			className='w-fit'>
			<RemoveFromWishlistButtons wishlistedBooksAmount={wishlistedBooksAmount} />
		</form>
	);
};
