'use client';

import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { usePathname } from 'next/navigation';

export const RemoveFromCartForm = ({ bookID }: { bookID: string }) => {
	const pathname = usePathname();

	return (
		<form action={CartFormRemove}>
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

			<button className='border w-fit hover:cursor-pointer hover:bg-black/[0.05] px-2 py-1 rounded-md'>
				Remove from Cart
			</button>
		</form>
	);
};
