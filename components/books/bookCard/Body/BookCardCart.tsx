import { useCartState } from '@/providers/CartProvider';
import { AddToCartForm } from '../../../CartForm/AddToCartForm';
import { RemoveFromCartForm } from '../../../CartForm/RemoveFromCartForm';

export const BookCardCart = ({ book }: { book: Book }) => {
	const { cartBooks } = useCartState();
	const isBookInCart = cartBooks.some((cartBook) => cartBook.id === book.id);

	return (
		<div className='grid place-content-center gap-2 min-h-[100px] bg-gunmetal text-white py-2'>
			<p className='text-xs font-light text-center'>{book.format}</p>
			{isBookInCart ? (
				<RemoveFromCartForm bookID={book.id} />
			) : (
				<AddToCartForm bookID={book.id} />
			)}
		</div>
	);
};
