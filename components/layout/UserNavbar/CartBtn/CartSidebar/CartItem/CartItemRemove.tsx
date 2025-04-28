'use client';

import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

export const CartItemRemove = ({
	book,
	setBooks,
}: {
	book: Book;
	setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) => {
	const [hover, setHover] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	const handleRemove = useCallback(async () => {
		setBooks((prevBooks) => prevBooks.filter((item) => item.id !== book.id));
		const formData = new FormData();
		formData.append('book-id', book.id);
		formData.append('pathname', pathname);
		await CartFormRemove(formData);
	}, [book.id, pathname, setBooks]);

	return (
		<button
			aria-label={`Remove ${book.title} from cart`}
			className='text-gray-500 focus:outline-none transition-colors duration-150 mr-5 cursor-pointer'
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			onClick={handleRemove}>
			{hover ? <DeleteForeverIcon /> : <DeleteIcon />}
		</button>
	);
};
