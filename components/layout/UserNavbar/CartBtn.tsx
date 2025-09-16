'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useState } from 'react';
import { CartSidebar } from '@/components/CartSidebar/CartSidebar';
import { useCartState } from '@/providers/CartProvider';

export const CartBtn = () => {
	const [openCart, setOpenCart] = useState(false);

	const { cartBooksAmount } = useCartState();

	const handleCartVisibility = () => {
		setOpenCart(!openCart);
	};

	return (
		<>
			<button
				className='shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer'
				onClick={handleCartVisibility}>
				<ShoppingCartOutlinedIcon />
				<div
					className={`absolute translate-4 bg-red-500 rounded-full ${
						cartBooksAmount < 10 ? 'px-[6px]' : 'px-[3px]'
					}`}>
					<p className='text-sm text-white'>{cartBooksAmount}</p>
				</div>
			</button>
			<CartSidebar
				openCart={openCart}
				setOpenCart={setOpenCart}
			/>
		</>
	);
};
