import { getUserDataProperty, isLoggedIn } from '@/data/user/GetUserData';
import { AddToCartForm } from './CartForm/AddToCartForm';
import { AddedToCartForm } from './CartForm/AddedToCartForm';
import { getUsersCartID, isAddedToCart } from '@/data/cart/GetCartData';
import { RemoveFromCartForm } from './CartForm/RemoveFromCartForm';

export const BookCart = async ({
	price,
	bookID,
	booksInCartAmount,
}: {
	price: string;
	bookID: string;
	booksInCartAmount: number;
}) => {
	const userID = await getUserDataProperty('id');
	const loggedIn = userID ? await isLoggedIn(userID) : false;
	const cartID = userID ? await getUsersCartID(userID) : null;
	const isBookInCart = cartID ? await isAddedToCart(cartID, bookID) : null;

	return (
		<div className='sm:col-span-2 md:col-span-1 grid text-center p-5 items-center border rounded-md shadow-[0px_2px_6px_-2px_#000]'>
			<p>Price: {price}</p>

			{loggedIn ? (
				isBookInCart ? (
					<div className='grid m-auto gap-2'>
						<AddedToCartForm
							bookID={bookID}
							quantity={isBookInCart[0].quantity}
						/>
						<RemoveFromCartForm bookID={bookID} />
					</div>
				) : (
					<AddToCartForm
						bookID={bookID}
						booksInCartAmount={booksInCartAmount}
					/>
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
