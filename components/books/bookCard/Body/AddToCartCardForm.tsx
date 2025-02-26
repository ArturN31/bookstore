import { CartFormInsert } from '@/data/actions/CartForm/CartFormInsert';
import { usePathname } from 'next/navigation';

export const AddToCartCardForm = ({ bookID }: { bookID: string }) => {
	const pathname = usePathname();

	return (
		<form action={CartFormInsert}>
			<input
				type='hidden'
				name='book-quantity'
				value={1}
			/>
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
			<button className='border px-2 py-1 cursor-pointer'>Add to cart</button>
		</form>
	);
};
