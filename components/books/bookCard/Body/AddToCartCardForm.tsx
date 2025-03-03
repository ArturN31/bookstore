import { CartFormInsert } from '@/data/actions/CartForm/CartFormInsert';
import { usePathname } from 'next/navigation';

export const AddToCartCardForm = ({
	bookID,
	loggedIn,
	profileExists,
}: {
	bookID: string;
	loggedIn: boolean;
	profileExists: boolean;
}) => {
	const pathname = usePathname();

	return (
		<form action={loggedIn && profileExists ? CartFormInsert : undefined}>
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
			<button
				className={`border px-2 py-1  ${
					!loggedIn || !profileExists ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
				}`}
				disabled={!loggedIn || !profileExists}>
				Add to cart
			</button>
		</form>
	);
};
