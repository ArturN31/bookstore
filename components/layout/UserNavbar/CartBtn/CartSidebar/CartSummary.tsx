export const CartSummary = ({
	books,
}: {
	books: { id: string; title: string; price: string; image_url: string; quantity: number }[];
}) => {
	const cartItemsAmount = books ? books.reduce((sum, book) => sum + book.quantity, 0) : 0;
	const cartTotal = books
		? books.reduce((sum, book) => sum + book.quantity * parseFloat(book.price.slice(1)), 0).toFixed(2)
		: '0.00';

	return (
		books &&
		books.length > 0 && (
			<div className='border-t p-4'>
				<div className='flex justify-between items-center'>
					<span className='text-gray-700'>Items:</span>
					<span className='font-semibold text-gray-800'>{cartItemsAmount}</span>
				</div>
				<div className='flex justify-between items-center'>
					<span className='text-gray-700'>Total:</span>
					<span className='font-semibold text-lg text-indigo-600'>&#163;{cartTotal}</span>
				</div>
			</div>
		)
	);
};
