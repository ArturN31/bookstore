'use client';

import { CartFormInsert } from '@/data/actions/CartForm/CartFormInsert';
import { usePathname } from 'next/navigation';

export const AddToCartForm = ({ bookID, booksInCartAmount }: { bookID: string; booksInCartAmount: number }) => {
	const pathname = usePathname();

	const SelectOptions = () => {
		const rows = [];
		for (let i = 1; i <= 10; i++) {
			rows.push(<option key={i}>{i}</option>);
		}
		return rows;
	};

	return (
		<>
			<form
				className='flex gap-2 justify-center'
				action={booksInCartAmount <= 10 ? CartFormInsert : undefined}>
				<input
					type='hidden'
					name='book-id'
					value={bookID}
				/>

				<input
					type='hidden'
					name='pathname'
					value={pathname}
				/>

				<select
					name='book-quantity'
					className={`border w-fit focus:outline-1 px-2 py-1 rounded-md ${
						booksInCartAmount >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					}`}
					disabled={booksInCartAmount >= 10}>
					<SelectOptions />
				</select>

				<button
					className={`border w-fit hover:bg-black/[0.05] px-2 py-1 rounded-md ${
						booksInCartAmount >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					}`}
					disabled={booksInCartAmount >= 10}>
					Add to Cart
				</button>
			</form>
			{booksInCartAmount >= 10 && <p>Cart is full.</p>}
		</>
	);
};
