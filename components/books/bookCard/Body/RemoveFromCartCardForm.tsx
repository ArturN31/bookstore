import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { usePathname } from 'next/navigation';

export const RemoveFromCartCardForm = ({ bookID }: { bookID: string }) => {
	const pathname = usePathname();

	return (
		<form action={CartFormRemove}>
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

			<button className='border px-2 py-1 cursor-pointer'>Remove from cart</button>
		</form>
	);
};
