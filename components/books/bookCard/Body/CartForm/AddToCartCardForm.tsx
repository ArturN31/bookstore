import { CartFormInsert } from '@/data/actions/CartForm/CartFormInsert';
import { useUserState } from '@/providers/UserProvider';
import { usePathname } from 'next/navigation';

export const AddToCartCardForm = ({
	bookID,
	profileExists,
	booksInCartAmount,
}: {
	bookID: string;
	profileExists: boolean;
	booksInCartAmount: number;
}) => {
	const pathname = usePathname();
	const { loggedIn } = useUserState();

	return (
		<div className='grid gap-2'>
			<form action={loggedIn && profileExists && booksInCartAmount <= 10 ? CartFormInsert : undefined}>
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
						!loggedIn || !profileExists || booksInCartAmount === 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					}`}
					disabled={!loggedIn || !profileExists || booksInCartAmount >= 10}>
					Add to cart
				</button>
			</form>

			<div>
				{!loggedIn && <p className='text-xs text-center'>Sign in to use cart</p>}

				{loggedIn && !profileExists && <p className='text-xs text-center'>Complete your user profile</p>}

				{loggedIn && profileExists && booksInCartAmount === 10 && <p className='text-xs text-center'>Cart is full</p>}
			</div>
		</div>
	);
};
