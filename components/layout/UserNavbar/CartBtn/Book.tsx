import Image from 'next/image';

export const Book = ({
	book,
}: {
	book: { id: string; title: string; price: string; image_url: string; quantity: number };
}) => {
	const priceWithoutSymbol = book.price.slice(1);
	const numericPrice = parseFloat(priceWithoutSymbol);
	const subtotal = (book.quantity * numericPrice).toFixed(2);

	return (
		<div className='bg-white rounded-md shadow-md border'>
			<div className='grid grid-cols-3 gap-4 px-4'>
				<div className='relative w-24 h-32 md:w-32 md:h-40 m-auto'>
					<Image
						src={book.image_url}
						alt={`Cover image for ${book.title}`}
						layout='fill'
						objectFit='contain'
						className='rounded-md'
					/>
				</div>

				<div className='col-span-2 flex flex-col justify-center'>
					<h3 className='text-lg font-semibold text-gray-800 text-center pb-2'>{book.title}</h3>
					<div>
						<div className='flex justify-between items-center'>
							<p className='text-sm text-gray-700'>Quantity:</p>
							<span className='font-semibold'>{book.quantity}</span>
						</div>
						<div className='flex justify-between items-center mt-1'>
							<p className='text-sm text-gray-700'>Price:</p>
							<span className='font-semibold'>{book.price}</span>
						</div>
						<div className='flex justify-between items-center mt-1'>
							<p className='text-sm text-gray-700'>Subtotal:</p>
							<span className='font-semibold'>&#163;{subtotal}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
