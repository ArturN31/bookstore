import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { usePathname } from 'next/navigation';

export const RemoveFromCartCardForm = ({
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
		<form action={loggedIn && profileExists ? CartFormRemove : undefined}>
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
				className={`border px-2 py-1 ${
					!loggedIn || !profileExists ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
				}`}
				disabled={!loggedIn || !profileExists}>
				Remove from cart
			</button>
		</form>
	);
};
