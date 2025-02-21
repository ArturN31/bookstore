import { CartForm } from './CartForm/CartForm';

export const BookCart = ({ price, bookID }: { price: string; bookID: string }) => {
	return (
		<div className='sm:col-span-2 md:col-span-1 grid text-center p-5 items-center border rounded-md shadow-[0px_2px_6px_-2px_#000]'>
			<p>Price: {price}</p>

			<CartForm bookID={bookID} />

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Parcel dispatched in 24h</p>

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<p>Delivery to the bookstore &#163;0</p>
		</div>
	);
};
