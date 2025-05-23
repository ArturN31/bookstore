'use client';

import { CartFormUpdate } from '@/data/actions/CartForm/CartFormUpdate';
import { usePathname } from 'next/navigation';

export const AddedToCartForm = ({ bookID, quantity }: { bookID: string; quantity: number }) => {
	const pathname = usePathname();

	const SelectOptions = () => {
		const rows = [];
		for (let i = 1; i <= 10; i++) {
			rows.push(<option key={i}>{i}</option>);
		}
		return rows;
	};

	return (
		<form
			className='flex gap-2 justify-center'
			action={CartFormUpdate}>
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
				defaultValue={quantity}
				name='book-quantity'
				className='border w-fit hover:cursor-pointer focus:outline-1 px-2 py-1 rounded-md'>
				<SelectOptions />
			</select>

			<button className='border w-fit hover:cursor-pointer hover:bg-black/[0.05] px-2 py-1 rounded-md'>
				Update Cart
			</button>
		</form>
	);
};
