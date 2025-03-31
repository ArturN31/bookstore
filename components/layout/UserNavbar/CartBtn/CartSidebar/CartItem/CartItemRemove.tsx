import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export const CartItemRemove = ({
	book,
}: {
	book: { id: string; title: string; price: string; image_url: string; quantity: number };
}) => {
	const [hover, setHover] = useState(false);
	const pathname = usePathname();

	return (
		<form action={CartFormRemove}>
			<input
				type='hidden'
				name='book-id'
				value={book.id}
			/>
			<input
				type='hidden'
				name='pathname'
				value={pathname}
			/>
			<button
				aria-label={`Remove ${book.title} from cart`}
				className='text-gray-500 focus:outline-none transition-colors duration-150 mr-5 cursor-pointer'
				onMouseEnter={() => {
					setHover(true);
				}}
				onMouseLeave={() => {
					setHover(false);
				}}>
				{hover ? <DeleteForeverIcon /> : <DeleteIcon />}
			</button>
		</form>
	);
};
