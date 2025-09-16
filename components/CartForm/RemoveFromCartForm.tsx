import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { useUserState } from '@/providers/UserProvider';
import RemoveShoppingCartOutlinedIcon from '@mui/icons-material/RemoveShoppingCartOutlined';
import { useActionState, useEffect, useTransition } from 'react';
import { useCartState } from '@/providers/CartProvider';

export const RemoveFromCartForm = ({ bookID }: { bookID: string }) => {
	const { loggedIn, profileExists } = useUserState();
	const { cartError, refreshCart } = useCartState();
	const [state, formAction] = useActionState(CartFormRemove, {
		success: false,
		message: '',
	});
	const [isPending, startTransition] = useTransition();
	const isButtonDisabled = !loggedIn || !profileExists;

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (isButtonDisabled) return;

		const formData = new FormData();
		formData.append('book-id', bookID);

		startTransition(() => {
			formAction(formData);
		});
	};

	const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		//stop the click event from bubbling up to the parent Card component
		event.stopPropagation();
	};

	useEffect(() => {
		if (state.success) refreshCart();
	}, [state.success, refreshCart]);

	return (
		<div className='grid gap-2'>
			<form onSubmit={handleSubmit}>
				<button
					onClick={handleButtonClick}
					disabled={isButtonDisabled || isPending}
					className='w-full px-2 min-h-[48px] rounded-[4px] font-bold text-yellow transition-[all_0.2s_ease-out] hover:transform-[scale(1.02)] hover:bg-yellow/[0.75] hover:text-gunmetal hover:cursor-pointer disabled:text-[#666] disabled:transform-none'>
					<RemoveShoppingCartOutlinedIcon />
					&nbsp; Remove from cart
				</button>
			</form>

			{!loggedIn && (
				<div className='text-xs text-center text-gray-400'>
					<p>Sign in to use cart</p>
				</div>
			)}

			{loggedIn && !profileExists && (
				<div className='text-xs text-center text-gray-400'>
					<p>Complete your user profile</p>
				</div>
			)}

			{(cartError || state.message) && (
				<div className='text-xs text-center text-red-400'>
					<p>{cartError || state.message}</p>
				</div>
			)}
		</div>
	);
};
