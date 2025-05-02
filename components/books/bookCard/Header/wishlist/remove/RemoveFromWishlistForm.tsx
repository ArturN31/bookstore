import { RemoveFromWishlistButtons } from './RemoveFromWishlistButtons';
import { usePathname } from 'next/navigation';
import { WishlistFormRemove } from '@/data/actions/WishlistForm/WishlistFormRemove';

export const RemoveFromWishlistForm = ({ bookID }: { bookID: string }) => {
	const pathname = usePathname();

	return (
		<form
			id='remove-from-wishlist-form'
			action={WishlistFormRemove}
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
			<RemoveFromWishlistButtons />
		</form>
	);
};
