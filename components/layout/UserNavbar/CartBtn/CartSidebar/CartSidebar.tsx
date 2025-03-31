import { Dispatch, SetStateAction } from 'react';
import { CartSummary } from './CartSummary';
import { CartHeader } from './CartHeader';
import { CartItem } from './CartItem/CartItem';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export const CartSidebar = ({
	books,
	setOpenCart,
}: {
	books: { id: string; title: string; price: string; image_url: string; quantity: number }[];
	setOpenCart: Dispatch<SetStateAction<boolean>>;
}) => {
	const handleCloseCart = () => {
		setOpenCart(false);
	};

	return (
		<div
			tabIndex={-1}
			aria-modal='true'
			role='dialog'>
			<CartHeader handleCloseCart={handleCloseCart} />
			<div className='overflow-y-auto flex-grow'>
				{books && books.length > 0 ? (
					<ul className='space-y-4 p-4'>
						{books.map((book) => (
							<li key={book.id}>
								<CartItem book={book} />
							</li>
						))}
					</ul>
				) : (
					<div className='text-center py-10 grid gap-3'>
						<ShoppingCartIcon sx={{ color: '#6a7282', margin: 'auto' }} />
						<p className='text-gray-500'>Your cart is currently empty.</p>
					</div>
				)}
			</div>

			{books && books.length > 0 && (
				<div className='bg-gray-100'>
					<CartSummary books={books} />
					<div className='border-y p-4'>
						<button className='w-full bg-gunmetal/[0.9] hover:bg-gunmetal text-white font-semibold py-3 rounded-md transition-colors duration-200'>
							Proceed to Checkout
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
