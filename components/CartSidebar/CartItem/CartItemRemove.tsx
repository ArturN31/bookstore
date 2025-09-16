'use client';

import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { useCartState } from '@/providers/CartProvider';
import { useUserState } from '@/providers/UserProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useState, useActionState, useTransition, useEffect } from 'react';

export const CartItemRemove = ({ book }: { book: Book }) => {
	const { loggedIn, profileExists } = useUserState();
	const { cartError, refreshCart } = useCartState();
	const [state, formAction] = useActionState(CartFormRemove, {
		success: false,
		message: '',
	});
	const [isPending, startTransition] = useTransition();
	const isButtonDisabled = !loggedIn || !profileExists || isPending;
	const [hover, setHover] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (isButtonDisabled) return;

		const formData = new FormData();
		formData.append('book-id', book.id);

		startTransition(() => {
			formAction(formData);
		});
	};

	useEffect(() => {
		if (state.success) refreshCart();
	}, [state.success, refreshCart]);

	return (
		<div className='grid gap-2'>
			<form onSubmit={handleSubmit}>
				<button
					disabled={isButtonDisabled}
					className='w-full grid place-self-center mx-2 transition-[all_0.2s_ease-out] hover:transform-[scale(1.15)] hover:cursor-pointer disabled:text-[#666] disabled:transform-none'
					onMouseEnter={() => setHover(true)}
					onMouseLeave={() => setHover(false)}>
					{hover ? <DeleteForeverIcon /> : <DeleteIcon />}
				</button>
			</form>

			{/* {cartError && (
				<div className='text-xs text-center'>
					<p className='text-red-400'>{cartError}</p>
				</div>
			)}

			{state.message && (
				<div className='text-xs text-center'>
					<p className='text-red-400'>{state.message}</p>
				</div>
			)} */}
		</div>
	);
};
