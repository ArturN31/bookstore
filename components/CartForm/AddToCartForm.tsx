import { CartFormInsert } from '@/data/actions/CartForm/CartFormInsert';
import { useUserState } from '@/providers/UserProvider';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCartState } from '@/providers/CartProvider';
import { useActionState, useEffect, useTransition } from 'react';

export const AddToCartForm = ({ bookID }: { bookID: string }) => {
	const { loggedIn, profileExists } = useUserState();
	const { cartBooksAmount, cartError, refreshCart } = useCartState();
	const [state, formAction] = useActionState(CartFormInsert, {
		success: false,
		message: '',
	});
	const [isPending, startTransition] = useTransition();
	const isButtonDisabled = !loggedIn || !profileExists || cartBooksAmount >= 10;

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (isButtonDisabled) return;

		const formData = new FormData();
		formData.append('book-id', bookID);
		formData.append('book-quantity', '1');

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
					type='submit'
					onClick={handleButtonClick}
					disabled={isButtonDisabled || isPending}
					className='w-full px-2 min-h-[48px] rounded-[4px] font-bold bg-yellow text-gunmetal transition-[all-0.2s-ease-out] hover:transform-[scale(1.02)] hover:bg-yellow hover:cursor-pointer disabled:bg-[#b3b3b3] disabled:text-[#666] disabled:transform-none'>
					<ShoppingCartOutlinedIcon />
					&nbsp; Add to cart
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

			{loggedIn && profileExists && cartBooksAmount === 10 && (
				<div className='text-xs text-center text-red-400'>
					<p>Cart is full</p>
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
