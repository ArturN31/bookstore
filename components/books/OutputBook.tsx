import Image from 'next/image';
import { OutputBookRating } from './OutputBookRating';
import { BookWishlist } from './wishlist/BookWishlist';
import Link from 'next/link';

export const OutputBook = ({ book, loggedIn }: { book: Book; loggedIn: boolean }) => {
	const bookRatingArray = book.reviews.map((review) => {
		return review.rating;
	});

	return (
		<div
			className='flex flex-col px-3 py-2 max-w-[300px] 
             sm:border-r sm:even:border-r-0 sm:last-of-type:border-r-0 
             md:border-r md:even:border-r md:nth-[3n]:border-r-0 
			 xl:not-last-of-type:border-r xl:nth-[4n]:border-r-0'>
			<div className='grid grid-cols-2 pb-1'>
				{loggedIn ? (
					<BookWishlist
						wishlisted={book.wishlisted}
						bookID={book.id}
					/>
				) : (
					<div></div>
				)}

				<OutputBookRating ratings={bookRatingArray} />
			</div>
			<Link
				href={`/book/${book.id}`}
				className='hover:bg-black/[0.05]'>
				<div className='bg-black'>
					<Image
						className='m-auto'
						src={book.image_url}
						alt=''
						width={200}
						height={200}></Image>
				</div>
				<div className='text-center p-2 grid gap-3'>
					<p className='text-sm font-semibold'>{book.title}</p>
					<div className='grid gap-1'>
						<p className='text-xs font-light'>{book.author}</p>
						<p className='text-xs font-light'>{book.publisher}</p>
					</div>
					<p className='text-xl font-semibold'>{book.price}</p>
				</div>
			</Link>
		</div>
	);
};
