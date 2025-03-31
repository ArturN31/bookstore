import React from 'react';
import { CartItemContent } from './CartItemContent';
import { CartItemRemove } from './CartItemRemove';

export const CartItem = ({
	book,
}: {
	book: { id: string; title: string; price: string; image_url: string; quantity: number };
}) => {
	return (
		<div className='bg-white py-3 px-4 border-b border-gray-200 flex items-center transition-transform duration-200 hover:bg-gray-50'>
			<CartItemRemove book={book} />
			<CartItemContent book={book} />
		</div>
	);
};
