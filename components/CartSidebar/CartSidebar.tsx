import { Dispatch, SetStateAction } from 'react';
import { CartSummary } from './CartSummary';
import { CartHeader } from './CartHeader';
import { CartItem } from './CartItem/CartItem';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/navigation';
import { useCartState } from '@/providers/CartProvider';

export const CartSidebar = ({
	openCart,
	setOpenCart,
}: {
	openCart: boolean;
	setOpenCart: Dispatch<SetStateAction<boolean>>;
}) => {
	const router = useRouter();
	const { cartBooks } = useCartState();

	const handleCloseCart = () => {
		setOpenCart(false);
	};

	return (
		<div
			aria-modal='true'
			role='dialog'
			className={`fixed top-0 right-0 z-50 h-full bg-white
				border-l border-black overflow-y-auto 
				transform transition-transform duration-1000 ease-in-out 
				w-auto max-w-[90vw] min-w-[300px] ${openCart ? 'translate-x-0' : 'translate-x-full'}`}>
			<CartHeader handleCloseCart={handleCloseCart} />

			{!cartBooks && (
				<div className='text-center py-10 grid gap-3'>
					<ShoppingCartIcon sx={{ color: '#6a7282', margin: 'auto' }} />
					<p className='text-gray-500'>Your cart is currently empty.</p>
				</div>
			)}

			{cartBooks && (
				<ul className='space-y-4 p-4 overflow-auto'>
					{cartBooks
						.sort(
							(a, b) =>
								new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
						)
						.map((book, index) => (
							<li key={book.id}>
								<CartItem book={book} />
								{index < cartBooks.length - 1 && (
									<hr className='my-4 border-t border-gray-200' />
								)}
							</li>
						))}
				</ul>
			)}

			{cartBooks && (
				<div className='sticky bottom-0'>
					<div className='w-full bg-gray-50'>
						<CartSummary />
					</div>

					<div className='w-full bg-gunmetal p-4'>
						<button
							className='w-full rounded-md bg-white py-3 font-semibold text-gunmetal transition-colors duration-200 hover:bg-gray-100 hover:cursor-pointer'
							onClick={() => router.push('/checkout')}>
							Proceed to Checkout
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
