import React from 'react';
import { CartItemContent } from './CartItemContent';
import { CartItemRemove } from './CartItemRemove';

export const CartItem = ({ book }: { book: Book }) => {
	return (
		<div className='bg-white py-3 px-4 flex items-center transition-transform duration-200 hover:bg-gray-50'>
			<CartItemRemove book={book} />
			<CartItemContent book={book} />
		</div>
	);
};
