import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CartFormUpdate } from '@/data/actions/CartForm/CartFormUpdate';
import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { useTransition } from 'react';

export const CartItemQuantityControls = ({
	quantity: initialQuantity,
	title,
	bookID,
	books,
	setBooks,
}: {
	quantity: number;
	title: string;
	bookID: string;
	books: Book[];
	setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) => {
	const pathname = usePathname();
	const [localQuantity, setLocalQuantity] = useState(initialQuantity);
	const [isPendingUpdate, startUpdateTransition] = useTransition();
	const [isPendingRemove, startRemoveTransition] = useTransition();

	const handleUpdate = useCallback(
		(newQuantity: number) => {
			startUpdateTransition(async () => {
				setBooks((prevBooks) =>
					prevBooks.map((book) => (book.id === bookID ? { ...book, quantity: newQuantity } : book)),
				);

				const formData = new FormData();
				formData.append('book-quantity', String(newQuantity));
				formData.append('book-id', bookID);
				formData.append('pathname', pathname);
				await CartFormUpdate(formData);
			});
		},
		[bookID, pathname, startUpdateTransition],
	);

	const debouncedUpdate = useDebouncedCallback(handleUpdate, 500);

	const handleRemove = useCallback(() => {
		startRemoveTransition(async () => {
			setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookID));

			const formData = new FormData();
			formData.append('book-id', bookID);
			formData.append('pathname', pathname);
			await CartFormRemove(formData);
		});
	}, [bookID, pathname, startRemoveTransition]);

	const decrement = () => {
		if (localQuantity > 1) {
			setLocalQuantity((prev) => prev - 1);
			debouncedUpdate(localQuantity - 1);
		} else if (localQuantity === 1) {
			handleRemove();
		}
	};

	const increment = () => {
		if (localQuantity < 10) {
			setLocalQuantity((prev) => prev + 1);
			debouncedUpdate(localQuantity + 1);
		}
	};

	return (
		<div className='flex items-center space-x-3'>
			<button
				className='bg-gray-100 hover:bg-red-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md transition-colors duration-150 cursor-pointer p-1'
				aria-label={`Decrease quantity of ${title}`}
				onClick={decrement}
				disabled={localQuantity <= 0 || isPendingUpdate || isPendingRemove}>
				<RemoveIcon className='h-5 w-5 text-red-500' />
			</button>
			<span className='text-lg font-semibold text-gray-800'>{localQuantity}</span>
			<button
				className='bg-gray-100 hover:bg-green-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md transition-colors duration-150 cursor-pointer p-1'
				aria-label={`Increase quantity of ${title}`}
				onClick={increment}
				disabled={isPendingUpdate || isPendingRemove}>
				<AddIcon className='h-5 w-5 text-green-500' />
			</button>
		</div>
	);
};
