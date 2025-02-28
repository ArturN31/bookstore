import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { usePathname } from 'next/navigation';

export const RemoveFromCartCardForm = ({ bookID, loggedIn }: { bookID: string; loggedIn: boolean }) => {
	const pathname = usePathname();

	return (
		<form action={loggedIn ? CartFormRemove : undefined}>
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
				className={`border px-2 py-1 ${!loggedIn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
				disabled={!loggedIn}>
				Remove from cart
			</button>
		</form>
	);
};
