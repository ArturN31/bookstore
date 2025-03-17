'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useRef, useState } from 'react';
import { CartSidebar } from './CartSidebar';

export const CartBtn = () => {
	const [openCart, setOpenCart] = useState(false);
	const sidebarRef = useRef<HTMLDivElement | null>(null);

	const handleOpenCart = () => {
		setOpenCart(true);
	};

	const handleCloseCart = (e: React.FocusEvent<HTMLButtonElement>) => {
		if (sidebarRef.current && !sidebarRef.current.contains(e.relatedTarget as Node)) {
			setOpenCart(false);
		}
	};

	return (
		<>
			<button
				className='shadow-md rounded-full w-12 h-12 place-items-center grid bg-yellow hover:bg-yellow/[0.8] hover:border hover:border-black hover:cursor-pointer'
				onClick={handleOpenCart}
				onBlur={handleCloseCart}>
				<ShoppingCartOutlinedIcon />
			</button>

			{openCart && (
				<CartSidebar
					setOpenCart={setOpenCart}
					sidebarRef={sidebarRef}
				/>
			)}
		</>
	);
};
