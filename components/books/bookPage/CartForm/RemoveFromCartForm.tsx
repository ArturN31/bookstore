import { CartFormRemove } from '@/data/actions/CartFormRemove';

export const RemoveFromCartForm = ({ bookID }: { bookID: string }) => {
	return (
		<form action={CartFormRemove}>
			<input
				type='hidden'
				name='book-id'
				value={bookID}
			/>
			<button className='border w-fit hover:cursor-pointer hover:bg-black/[0.05] px-2 py-1 rounded-md'>
				Remove from Cart
			</button>
		</form>
	);
};
