import { Dispatch, RefObject, SetStateAction } from 'react';
import CloseIcon from '@mui/icons-material/Close';

export const CartSidebar = ({
	setOpenCart,
	sidebarRef,
}: {
	setOpenCart: Dispatch<SetStateAction<boolean>>;
	sidebarRef: RefObject<HTMLDivElement | null>;
}) => {
	const handleCloseCart = () => {
		setOpenCart(false);
	};

	return (
		<div
			className='absolute z-40 min-h-screen top-0 min-w-[250px] right-0 bg-white border-x shadow-md'
			ref={sidebarRef}
			tabIndex={-1}>
			<div className='flex items-center justify-between border-b p-4'>
				<p className='text-lg font-semibold'>Your Cart</p>
				<button
					className='border rounded-full p-1 cursor-pointer hover:bg-gray-100'
					onClick={handleCloseCart}>
					<CloseIcon />
				</button>
			</div>

			<div className='p-4'>
				<p className='text-gray-500'>Your cart is currently empty.</p>
			</div>
		</div>
	);
};
