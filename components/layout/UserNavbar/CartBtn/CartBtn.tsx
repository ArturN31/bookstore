'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useRef, useState } from 'react';
import { CartSidebar } from './CartSidebar/CartSidebar';

export const CartBtn = ({
	books,
}: {
	books: { id: string; title: string; price: string; image_url: string; quantity: number }[];
}) => {
	const [openCart, setOpenCart] = useState(false);
	const sidebarRef = useRef<HTMLDivElement | null>(null);

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

			<div
				className={`fixed top-0 right-0 z-50 h-full bg-white border-l border-black shadow-md overflow-y-auto transform transition-transform duration-700 ease-in-out ${
					openCart ? 'translate-x-0' : 'translate-x-full'
				}`}
				style={{ width: 'auto', visibility: openCart ? 'visible' : 'hidden' }}
				ref={sidebarRef}>
				<CartSidebar
					books={books}
					setOpenCart={setOpenCart}
				/>
			</div>
		</>
	);
};
