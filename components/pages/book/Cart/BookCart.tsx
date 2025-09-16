'use client';

import { AddToCartForm } from '@/components/CartForm/AddToCartForm';
import { RemoveFromCartForm } from '@/components/CartForm/RemoveFromCartForm';
import { useUserState } from '@/providers/UserProvider';
import { useCartState } from '@/providers/CartProvider';
import { ChangeQuantityForm } from '@/components/CartForm/ChangeQuantityForm';

export const BookCart = ({ book }: { book: Book }) => {
	const { loggedIn, profileExists } = useUserState();
	const { cartBooks } = useCartState();
	const bookInCart = cartBooks.filter((cartBook) => cartBook.id === book.id);

	return (
		<div className='sm:col-span-2 md:col-span-1 grid text-center p-5 items-center border border-black rounded-md shadow-[0px_2px_6px_-2px_#000] bg-gunmetal text-white'>
			<p>Price: {book.price}</p>

			{loggedIn && profileExists ? (
				bookInCart.length > 0 ? (
					<div className='grid m-auto gap-2'>
						<ChangeQuantityForm book={bookInCart[0]} />
						<RemoveFromCartForm bookID={book.id} />
					</div>
				) : (
					<AddToCartForm bookID={book.id} />
				)
			) : (
				<>
					<p className='text-center'>New to Books 4 You?</p>
					<p>
						Create an account&nbsp;
						<a
							href='/user/auth/signup'
							className='text-sky-500 hover:text-sky-700'>
							here
						</a>
						&nbsp;to buy in our store.
					</p>
				</>
			)}

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Parcel dispatched in 24h</p>

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Delivery to the bookstore &#163;0</p>
		</div>
	);
};
