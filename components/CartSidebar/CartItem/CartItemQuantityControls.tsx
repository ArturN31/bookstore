import { useState, useCallback, useEffect, useActionState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTransition } from 'react';
import { useCartActions } from '@/providers/cart/utils/useCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { enqueueSnackbar } from 'notistack';
import { CartAction } from '@/data/actions/CartForm/CartAction';
import { useUserState } from '@/providers/user/utils/useUser';

export const CartItemQuantityControls = ({
    quantity: initialQuantity,
    book,
}: {
    quantity: number;
    book: Book;
}) => {
    const { refreshCart } = useCartActions();
    const { user } = useUserState();

    const [localQuantity, setLocalQuantity] = useState<number>(initialQuantity);
    const [prevInitialQuantity, setPrevInitialQuantity] = useState<number>(initialQuantity);

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    });
    const [isPending, startTransition] = useTransition();

    if (initialQuantity !== prevInitialQuantity) {
        setPrevInitialQuantity(initialQuantity);
        setLocalQuantity(initialQuantity);
    }

    const dispatchCartAction = useCallback(
        (type: 'UPDATE' | 'REMOVE', qty?: number) => {
            const formData = new FormData();
            formData.append('action-type', type);
            formData.append('book-id', book.id);
            if (qty !== undefined) formData.append('book-quantity', String(qty));

            startTransition(async () => {
                await formAction(formData);
            });
        },
        [book.id, formAction],
    );

    const debouncedUpdate = useDebouncedCallback((qty: number) => {
        dispatchCartAction('UPDATE', qty);
    }, 500);

    const decrement = () => {
        if (localQuantity === 1) {
            dispatchCartAction('REMOVE');
        } else {
            const nextQty = localQuantity - 1;
            setLocalQuantity(nextQty);
            debouncedUpdate(nextQty);
        }
    };

    const increment = () => {
        if (localQuantity >= 10) {
            enqueueSnackbar('You can only purchase 10 of the same books.', { variant: 'warning' });
            return;
        }

        if (localQuantity >= book.stock_quantity) {
            const message =
                book.stock_quantity === 1
                    ? 'There is only 1 book left in stock.'
                    : `There are only ${book.stock_quantity} books left in stock.`;
            enqueueSnackbar(message, { variant: 'warning' });
            return;
        }

        const nextQty = localQuantity + 1;
        setLocalQuantity(nextQty);
        debouncedUpdate(nextQty);
    };

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'warning';
        enqueueSnackbar(state.message, { variant });

        if (state.success) refreshCart(user.id);
    }, [state.message, state.success, state.timestamp, refreshCart, user.id]);

    return (
        <div className="flex w-fit flex-col items-center gap-2">
            <div className="flex items-center space-x-4">
                <button
                    data-testid="cart-item-decrement-btn"
                    onClick={decrement}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:cursor-pointer hover:text-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none disabled:opacity-50"
                >
                    <RemoveIcon className="h-5 w-5" />
                </button>

                <p
                    className={`w-10 text-center text-base font-semibold ${isPending ? 'text-gray-400' : 'text-gray-800'}`}
                >
                    {localQuantity}
                </p>

                <button
                    data-testid="cart-item-increment-btn"
                    onClick={increment}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:cursor-pointer hover:text-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none disabled:opacity-50"
                >
                    <AddIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};
