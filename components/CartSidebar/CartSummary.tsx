import { useCartState } from '@/providers/CartProvider';

export const CartSummary = () => {
	const { cartBooks, cartBooksAmount, cartItemsAmount, cartTotal } = useCartState();

	return (
		cartBooks && (
			<div className='flex flex-col gap-2 px-4 py-4 border-t border-gray-200'>
				<div className='flex justify-between items-center'>
					<span className='text-sm text-gray-700'>Books:</span>
					<span className='text-sm font-semibold text-gray-800'>{cartBooksAmount}</span>
				</div>
				<div className='flex justify-between items-center'>
					<span className='text-sm text-gray-700'>Items:</span>
					<span className='text-sm font-semibold text-gray-800'>{cartItemsAmount}</span>
				</div>
				<div className='flex justify-between items-center pt-2 mt-2 border-t border-gray-200'>
					<span className='text-base font-semibold text-gray-800'>Total:</span>
					<span className='text-lg font-bold text-indigo-600'>£{cartTotal}</span>
				</div>
			</div>
		)
	);
};
