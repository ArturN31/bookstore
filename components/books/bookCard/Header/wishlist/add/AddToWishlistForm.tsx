import { AddToWishlistButtons } from './AddToWishlistButtons';
import { WishlistInsertAction } from '@/data/actions/WishlistForm/WishlistInsertAction';
import { usePathname } from 'next/navigation';

export const AddToWishlistForm = ({
	bookID,
	wishlistedBooksAmount,
}: {
	bookID: string;
	wishlistedBooksAmount: number;
}) => {
	const pathname = usePathname();

	return (
		<form
			id='add-to-wishlist-form'
			action={WishlistInsertAction}
			className='w-fit'>
			<input
				type='hidden'
				name='book-id'
				value={bookID}
			/>
			<input
				type='hidden'
				name='pathname'
				value={pathname}
			/>
			<AddToWishlistButtons wishlistedBooksAmount={wishlistedBooksAmount} />
		</form>
	);
};
