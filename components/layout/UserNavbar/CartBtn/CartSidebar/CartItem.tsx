import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export const CartItem = ({
	book,
}: {
	book: { id: string; title: string; price: string; image_url: string; quantity: number };
}) => {
	const [quantity, setQuantity] = useState(book.quantity);
	const subtotal = parseFloat(book.price.slice(1)) * quantity;

	const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newQuantity = parseInt(event.target.value, 10);
		if (!isNaN(newQuantity) && newQuantity > 0) {
			setQuantity(newQuantity);
		}
	};

	const handleIncrement = () => {
		setQuantity((prevQuantity) => prevQuantity + 1);
	};

	const handleDecrement = () => {
		if (quantity > 1) {
			setQuantity((prevQuantity) => prevQuantity - 1);
		}
	};

	return (
		<div className='bg-white py-3 px-4 border-b border-gray-200 flex items-center transition-transform duration-200 hover:bg-gray-100'>
			{/* Remove Button - More Visual Focus */}
			<button
				aria-label={`Remove ${book.title} from cart`}
				className='text-gray-500 hover:text-red-600 focus:outline-none transition-colors duration-150 mr-5'>
				<DeleteIcon className='h-5 w-5' />
			</button>

			<div className='flex items-center flex-1 min-w-0'>
				{/* Image */}
				<div className='w-20 h-20 rounded-md overflow-hidden flex-shrink-0'>
					<img
						src={book.image_url}
						alt={book.title}
						className='w-full h-full object-cover'
					/>
				</div>

				{/* Details */}
				<div className='ml-4 flex-1 min-w-0'>
					<h3 className='text-lg font-semibold text-gray-800 truncate'>{book.title}</h3>
					<div className='flex items-center justify-between mt-2'>
						{/* Subtotal */}
						<p className='text-sm font-semibold text-gray-800'>&#163;{subtotal.toFixed(2)}</p>

						{/* Quantity Controls */}
						<div className='flex items-center rounded-full overflow-hidden bg-gray-100'>
							<button
								onClick={handleDecrement}
								className='px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gunmetal rounded-full transition-colors duration-150'
								aria-label={`Decrease quantity of ${book.title}`}>
								<RemoveIcon sx={{ fontSize: '16px' }} />
							</button>
							<input
								readOnly
								value={quantity}
								onChange={handleQuantityChange}
								className='w-8 text-center focus:outline-none focus:ring-0 text-sm font-medium bg-transparent'
								min='1'
								aria-label={`Quantity of ${book.title}`}
							/>
							<button
								onClick={handleIncrement}
								className='px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gunmetal rounded-full transition-colors duration-150'
								aria-label={`Increase quantity of ${book.title}`}>
								<AddIcon sx={{ fontSize: '16px' }} />
							</button>
						</div>
					</div>

					{/* Original Price */}
					{quantity != 1 && (
						<p className='text-xs text-gray-500 mt-1'>&#163;{parseFloat(book.price.slice(1)).toFixed(2)}</p>
					)}
				</div>
			</div>
		</div>
	);
};
