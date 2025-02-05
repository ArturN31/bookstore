import Image from 'next/image';
import { OutputBookRating } from './OutputBookRating';
import { BookWishlist } from './wishlist/BookWishlist';

export const OutputBook = ({ book, index }: { book: Book; index: number }) => {
	const fourColsDivider = index % 4 !== 0 ? 'md:border-r' : ''; //divides 4 cols grid - col | col | col | col
	const twoColsDivider = index % 2 !== 0 ? 'sm:border-r' : ''; //divides 2 cols grid - col | col

	const bookRatingArray = book.reviews.map((review) => {
		return review.rating;
	});

	return (
		<div className={`flex flex-col px-3  max-w-[300px] ${fourColsDivider} ${twoColsDivider}`}>
			<div className='grid grid-cols-2 pb-1'>
				<BookWishlist bookID={book.id} />
				<OutputBookRating ratings={bookRatingArray} />
			</div>
			<div className='bg-black'>
				<Image
					className='m-auto'
					src={book.image_url}
					alt=''
					width={200}
					height={200}></Image>
			</div>
			<div className='text-center p-2 grid gap-3 h-full'>
				<p className='text-sm font-semibold'>{book.title}</p>
				<div className='grid gap-1'>
					<p className='text-xs font-light'>{book.author}</p>
					<p className='text-xs font-light'>{book.publisher}</p>
				</div>
				<p className='text-xl font-semibold'>{book.price}</p>
			</div>
		</div>
	);
};
