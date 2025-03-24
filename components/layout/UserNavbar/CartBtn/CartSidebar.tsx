import { Dispatch, RefObject, SetStateAction } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Book } from './Book';

export const CartSidebar = ({
	books,
	setOpenCart,
	sidebarRef,
}: {
	books: { id: string; title: string; price: string; image_url: string; quantity: number }[];
	setOpenCart: Dispatch<SetStateAction<boolean>>;
	sidebarRef: RefObject<HTMLDivElement | null>;
}) => {
	const handleCloseCart = () => {
		setOpenCart(false);
	};

	const cartItemsAmount = books ? books.reduce((sum, book) => sum + book.quantity, 0) : 0;
	const cartTotal = books
		? books
				.reduce((sum, book) => sum + book.quantity * parseFloat(book.price.slice(1)), 0) // Assuming price always starts with currency
				.toFixed(2)
		: '0.00';

	return (
		<div
			className='fixed top-0 right-0 z-50 h-full bg-white border-l shadow-lg transform transition-transform duration-300 ease-in-out w-full sm:max-w-md'
			style={{ transform: 'translateX(0)' }} // Initial style, will be controlled by state
			ref={sidebarRef}
			tabIndex={-1}>
			{/* Header */}
			<div className='flex items-center justify-between bg-gray-100 border-b p-4'>
				<h2 className='text-xl font-semibold text-gray-800'>Your Cart</h2>
				<button
					className='hover:bg-gray-200 rounded-full p-2 transition-colors duration-200'
					onClick={handleCloseCart}>
					<CloseIcon className='text-gray-600' />
				</button>
			</div>

			{/* Cart Items */}
			<div className='p-4 overflow-y-auto flex-grow'>
				{books && books.length > 0 ? (
					<div className='space-y-4'>
						{books.map((book) => (
							<Book
								book={book}
								key={book.id}
							/>
						))}
					</div>
				) : (
					<div className='text-center py-8'>
						<p className='text-gray-500'>Your cart is currently empty.</p>
						{/* You might want to add a link back to the shop here */}
					</div>
				)}
			</div>

			{/* Cart Summary */}
			{books && books.length > 0 && (
				<div className='bg-gray-100 border-t p-4'>
					<div className='flex justify-between items-center mb-2'>
						<span className='text-gray-700'>Items:</span>
						<span className='font-semibold text-gray-800'>{cartItemsAmount}</span>
					</div>
					<div className='flex justify-between items-center'>
						<span className='text-gray-700'>Total:</span>
						<span className='font-semibold text-lg text-indigo-600'>&#163;{cartTotal}</span>
					</div>
				</div>
			)}
		</div>
	);
};
