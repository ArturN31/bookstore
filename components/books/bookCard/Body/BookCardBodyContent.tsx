import { CardContent, CardMedia, List } from '@mui/material';
import Image from 'next/image';
import { BookCardCart } from './BookCardCart';

export const BookCardBodyContent = ({ book }: { book: Book }) => {
	return (
		<div className='h-full grid'>
			<CardMedia className='bg-black max-h-[200px]'>
				<Image
					className='m-auto'
					src={book.image_url}
					alt={`The placeholder image for ${book.title}.`}
					width={200}
					height={200}
				/>
			</CardMedia>
			<CardContent>
				<List className='text-center grid gap-3'>
					<p className='text-base font-semibold text-gunmetal'>{book.title}</p>
					<div className='grid gap-1'>
						<p className='text-sm font-normal text-gunmetal'>{book.author}</p>
						<p className='text-xs font-light text-gray-400'>{book.publisher}</p>
					</div>
					<p className='text-xl font-bold '>{book.price}</p>
				</List>
			</CardContent>
			<BookCardCart book={book} />
		</div>
	);
};
