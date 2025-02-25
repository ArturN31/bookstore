import { createClient } from '@/utils/db/server';
import { AddToWishlistButtons } from './AddToWishlistButtons';
import { revalidatePath } from 'next/cache';

export const AddToWishlistForm = ({ bookID }: { bookID: string }) => {
	const getUserID = async () => {
		'use server';

		const supabase = await createClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		return user?.id;
	};

	const AddToWishlist = async () => {
		'use server';

		const userID = await getUserID();
		const supabase = await createClient();
		const { error } = await supabase.from('wishlist').insert([
			{
				user_id: userID,
				book_id: bookID,
			},
		]);

		if (error) console.log(error);
		revalidatePath('/');
	};

	return (
		<form
			id='add-to-wishlist-form'
			action={AddToWishlist}
			className='w-fit'>
			<AddToWishlistButtons />
		</form>
	);
};
