'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useState } from 'react';
import { CartSidebar } from './CartSidebar/CartSidebar';

export const CartBtn = ({
	books,
	setBooks,
}: {
	books: Book[];
	setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) => {
	const [openCart, setOpenCart] = useState(false);

	const handleCartVisibility = () => {
		setOpenCart(!openCart);
	};

	const cartItemsAmount = books ? books.reduce((sum, book) => sum + book.quantity, 0) : 0;

	return (
		<>
			<button
				className='shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer'
				onClick={handleCartVisibility}>
				<ShoppingCartOutlinedIcon />
				<div
					className={`absolute translate-4 bg-red-500 rounded-full ${cartItemsAmount < 10 ? 'px-[6px]' : 'px-[3px]'}`}>
					<p className='text-sm text-white'>{cartItemsAmount}</p>
				</div>
			</button>
			<CartSidebar
				books={books}
				openCart={openCart}
				setOpenCart={setOpenCart}
				setBooks={setBooks}
			/>
		</>
	);
};
