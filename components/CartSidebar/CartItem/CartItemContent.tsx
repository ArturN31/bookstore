import Image from 'next/image';
import { CartItemQuantityControls } from './CartItemQuantityControls';

export const CartItemContent = ({ book }: { book: Book }) => {
	const subtotal = (parseFloat(book.price.slice(1)) * book.quantity).toFixed(2);
	const originalPrice = parseFloat(book.price.slice(1)).toFixed(2);

	return (
		<div className='w-full'>
			<div className='flex items-center justify-between gap-4'>
				{/* Left Side: Image and Details */}
				<div className='flex items-center gap-4'>
					<div className='h-16 w-16 flex-shrink-0 overflow-hidden rounded-md'>
						<Image
							width={64}
							height={64}
							src={book.image_url}
							alt={book.title}
							className='h-full w-full object-cover'
						/>
					</div>
					<div className='flex-1'>
						<h3 className='truncate text-sm font-semibold text-gray-800'>{book.title}</h3>
						<div className='mt-1 flex items-center gap-2'>
							<p className='text-xs font-bold text-gray-800'>£{subtotal}</p>
							{book.quantity !== 1 && (
								<p className='text-xs text-gray-500'>£{originalPrice}</p>
							)}
						</div>
					</div>
				</div>
				{/* Right Side: Quantity Controls */}
				<div className='flex items-end'>
					<CartItemQuantityControls
						quantity={book.quantity}
						book={book}
					/>
				</div>
			</div>
		</div>
	);
};
