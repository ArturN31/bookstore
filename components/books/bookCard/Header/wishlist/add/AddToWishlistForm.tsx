import { AddToWishlistButtons } from './AddToWishlistButtons';
import { WishlistFormInsert } from '@/data/actions/WishlistForm/WishlistFormInsert';
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
			action={WishlistFormInsert}
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
