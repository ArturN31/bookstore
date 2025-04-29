import Image from 'next/image';
import { CartItemQuantityControls } from './CartItemQuantityControls';

export const CartItemContent = ({
	book,
	setBooks,
}: {
	book: Book;
	setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) => {
	const subtotal = (parseFloat(book.price.slice(1)) * book.quantity).toFixed(2);
	const originalPrice = parseFloat(book.price.slice(1)).toFixed(2);

	return (
		<div className='flex items-center flex-1 min-w-0'>
			{/* Image */}
			<div className='w-20 h-20 rounded-md overflow-hidden flex-shrink-0'>
				<Image
					width={80}
					height={80}
					src={book.image_url}
					alt={book.title}
					className='w-full h-full object-cover'
				/>
			</div>

			{/* Details */}
			<div className='ml-4 flex-1 min-w-0'>
				<h3 className='text-lg font-semibold text-gray-800 truncate'>{book.title}</h3>
				<div className='flex items-center justify-between mt-2'>
					<p className='text-sm font-semibold text-gray-800'>&#163;{subtotal}</p>

					<CartItemQuantityControls
						quantity={book.quantity}
						title={book.title}
						bookID={book.id}
						setBooks={setBooks}
					/>
				</div>

				{book.quantity != 1 && <p className='text-xs text-gray-500 mt-1'>&#163;{originalPrice}</p>}
			</div>
		</div>
	);
};
