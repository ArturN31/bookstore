'use client';

import { CartFormUpdate } from '@/data/actions/CartForm/CartFormUpdate';
import { useCartState } from '@/providers/CartProvider';
import { useActionState, useEffect, useState, useTransition } from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

export const ChangeQuantityForm = ({ bookID }: { bookID: string }) => {
	const { cartBooks, cartError, refreshCart } = useCartState();
	const currentBook = cartBooks.find((cartBook) => cartBook.id === bookID);
	const initialQuantity = currentBook?.quantity || 1;
	const [quantity, setQuantity] = useState(initialQuantity);
	const [, startTransition] = useTransition();
	const [state, formAction, isPending] = useActionState(CartFormUpdate, {
		success: false,
		message: '',
	});

	useEffect(() => {
		if (state.success) refreshCart();
	}, [state.success, refreshCart]);

	useEffect(() => {
		setQuantity(initialQuantity);
	}, [initialQuantity]);

	const handleQuantityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setQuantity(parseInt(event.target.value, 10));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData();
		formData.append('book-id', bookID);
		formData.append('book-quantity', quantity.toString());

		startTransition(() => {
			formAction(formData);
		});
	};

	return (
		<form
			className='flex gap-2'
			onSubmit={handleSubmit}>
			<select
				value={quantity}
				onChange={handleQuantityChange}
				name='book-quantity'
				className='border w-fit hover:cursor-pointer focus:outline-1 px-2 py-1 rounded-[4px] bg-white text-black'>
				{[...Array(10)].map((_, i) => (
					<option
						className='text-black'
						key={i + 1}
						value={i + 1}>
						{i + 1}
					</option>
				))}
			</select>

			<button
				className='w-full px-4 min-h-[48px] rounded-[4px] font-bold bg-yellow text-gunmetal transition-[all-0.2s-ease-out] hover:transform-[scale(1.02)] hover:bg-yellow hover:cursor-pointer'
				disabled={isPending}>
				<ShoppingCartOutlinedIcon />
				&nbsp; Update cart
			</button>

			{cartError && (
				<div className='text-xs text-center'>
					<p className='text-red-400'>{cartError}</p>
				</div>
			)}
		</form>
	);
};
