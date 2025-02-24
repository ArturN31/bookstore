import { getUserDataProperty } from '@/data/user/GetUserData';
import { AddToCartForm } from './CartForm/AddToCartForm';
import { AddedToCartForm } from './CartForm/AddedToCartForm';
import { getCartItemData, getUsersCartID, isAddedToCart } from '@/data/cart/GetCartData';
import { RemoveFromCartForm } from './CartForm/RemoveFromCartForm';

export const BookCart = async ({ price, bookID }: { price: string; bookID: string }) => {
	const userID = await getUserDataProperty('id');

	if (userID) {
		const cart = await getUsersCartID(userID);
		if (cart) {
			const addedToCart = await isAddedToCart(cart, bookID);
			const cartItem = await getCartItemData(cart, bookID);

			return (
				<div className='sm:col-span-2 md:col-span-1 grid text-center p-5 items-center border rounded-md shadow-[0px_2px_6px_-2px_#000]'>
					<p>Price: {price}</p>

					{addedToCart && cartItem ? (
						<div className='grid m-auto gap-2'>
							<AddedToCartForm
								bookID={bookID}
								quantity={cartItem[0].quantity}
							/>
							<RemoveFromCartForm bookID={bookID} />
						</div>
					) : (
						<AddToCartForm bookID={bookID} />
					)}

					<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

					<p>Parcel dispatched in 24h</p>

					<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

					<p>Delivery to the bookstore &#163;0</p>
				</div>
			);
		}
	}

	return (
		<div className='sm:col-span-2 md:col-span-1 grid text-center p-5 items-center border rounded-md shadow-[0px_2px_6px_-2px_#000]'>
			<p>Price: {price}</p>

			<AddToCartForm bookID={bookID} />

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Parcel dispatched in 24h</p>

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Delivery to the bookstore &#163;0</p>
		</div>
	);
};
