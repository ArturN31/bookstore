import { useState, useCallback, useEffect, useActionState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { CartFormUpdate } from '@/data/actions/CartForm/CartFormUpdate';
import { CartFormRemove } from '@/data/actions/CartForm/CartFormRemove';
import { useTransition } from 'react';
import { useCartState } from '@/providers/CartProvider';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

export const CartItemQuantityControls = ({
	quantity: initialQuantity,
	book,
}: {
	quantity: number;
	book: Book;
}) => {
	const { refreshCart, cartError } = useCartState();
	const [localQuantity, setLocalQuantity] = useState(initialQuantity);
	const [stockMessage, setStockMessage] = useState('');

	const cartAction = async (
		prevState: { success: boolean; message: string },
		formData: FormData,
	) => {
		const actionType = formData.get('action-type');

		if (actionType === 'remove') {
			return await CartFormRemove(prevState, formData);
		} else if (actionType === 'update') {
			return await CartFormUpdate(prevState, formData);
		} else if (actionType === 'clear-message') {
			return { success: false, message: '' };
		}
		return { success: false, message: 'Invalid action type' };
	};

	const [state, formAction] = useActionState(cartAction, {
		success: false,
		message: '',
	});
	const [isPending, startTransition] = useTransition();

	const handleUpdate = useCallback(
		(newQuantity: number) => {
			const formData = new FormData();
			formData.append('action-type', 'update');
			formData.append('book-quantity', String(newQuantity));
			formData.append('book-id', book.id);
			startTransition(() => {
				formAction(formData);
			});
		},
		[book.id, formAction],
	);

	const debouncedUpdate = useDebouncedCallback(handleUpdate, 500);

	const decrement = () => {
		if (localQuantity === 1) {
			handleRemove();
		} else {
			setLocalQuantity((prev) => prev - 1);
			setStockMessage('');
			debouncedUpdate(localQuantity - 1);
		}
	};

	const increment = () => {
		if (localQuantity === 10) {
			setStockMessage('You can only purchase 10 of the same books.');
			return;
		}

		if (localQuantity >= book.stock_quantity) {
			const message =
				book.stock_quantity === 1
					? 'There is only 1 book left in stock.'
					: `There are only ${book.stock_quantity} books left in stock.`;
			setStockMessage(message);
			return;
		}

		if (localQuantity < 10) {
			setLocalQuantity((prev) => prev + 1);
			setStockMessage('');
			debouncedUpdate(localQuantity + 1);
		}
	};

	const handleRemove = useCallback(() => {
		const formData = new FormData();
		formData.append('action-type', 'remove');
		formData.append('book-id', book.id);
		startTransition(() => {
			formAction(formData);
		});
	}, [book.id, formAction]);

	useEffect(() => {
		if (state.success || cartError || !isPending) {
			refreshCart();
		}
	}, [state.success, cartError, isPending, refreshCart]);

	useEffect(() => {
		let timer: NodeJS.Timeout | undefined;

		if (state.message) {
			timer = setTimeout(() => {
				const formData = new FormData();
				formData.append('action-type', 'clear-message');
				startTransition(() => {
					formAction(formData);
				});
			}, 3000);
		}

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [state.message, formAction]);

	useEffect(() => {
		let timer: NodeJS.Timeout | undefined;
		if (stockMessage) {
			timer = setTimeout(() => {
				setStockMessage('');
			}, 5000);
		}
		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [stockMessage]);

	return (
		<div className='flex w-fit flex-col items-center gap-2'>
			<div className='flex items-center space-x-4'>
				<button
					onClick={decrement}
					className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400'>
					<RemoveIcon className='h-5 w-5' />
				</button>
				<p className='w-10 text-center text-base font-semibold text-gray-800'>
					{localQuantity}
				</p>
				<button
					onClick={increment}
					className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400'>
					<AddIcon className='h-5 w-5' />
				</button>
			</div>
			<div className='w-40 min-h-[1.5rem] pt-1'>
				{(cartError || state.message || stockMessage) && (
					<div className='text-xs text-center text-red-500'>
						<p>{cartError || state.message || stockMessage}</p>
					</div>
				)}
			</div>
		</div>
	);
};
