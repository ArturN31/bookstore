import { Dispatch, SetStateAction } from 'react';
import { CartSummary } from './CartSummary';
import { CartHeader } from './CartHeader';
import { CartItem } from './CartItem/CartItem';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/navigation';

export const CartSidebar = ({
	books,
	openCart,
	setOpenCart,
	setBooks,
}: {
	books: Book[];
	openCart: boolean;
	setOpenCart: Dispatch<SetStateAction<boolean>>;
	setBooks: Dispatch<SetStateAction<Book[]>>;
}) => {
	const router = useRouter();

	const handleCloseCart = () => {
		setOpenCart(false);
	};

	return (
		<div
			aria-modal='true'
			role='dialog'
			className={`fixed top-0 right-0 z-50 h-full bg-white border-l border-black overflow-y-auto transform transition-transform duration-1000 ease-in-out ${
				openCart ? 'translate-x-0' : 'translate-x-full'
			}`}
			style={{ width: 'auto', maxWidth: '90vw', minWidth: '300px' }}>
			<CartHeader handleCloseCart={handleCloseCart} />
			<div className='flex-grow'>
				{books && books.length > 0 ? (
					<ul className='space-y-4 p-4'>
						{books.map((book) => (
							<li key={book.id}>
								<CartItem
									book={book}
									setBooks={setBooks}
								/>
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
						<button
							className='w-full bg-gunmetal/[0.9] hover:bg-gunmetal text-white font-semibold py-3 rounded-md transition-colors duration-200 cursor-pointer'
							onClick={() => router.push('/checkout')}>
							Proceed to Checkout
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
