'use client';

import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useActionState, useEffect, useState, useTransition } from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { enqueueSnackbar } from 'notistack';
import { CartAction } from '@/data/actions/CartForm/CartAction';

export const ChangeQuantityForm = ({ bookID }: { bookID: string }) => {
    const { cartBooks } = useCartState();
    const { refreshCart } = useCartActions();

    const currentBook = cartBooks.find((cartBook) => cartBook.id === bookID);
    const initialQuantity = currentBook?.quantity || 1;

    const [quantity, setQuantity] = useState(initialQuantity);
    const [isPending, startTransition] = useTransition();

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    });

    useEffect(() => {
        if (state.success) refreshCart();
    }, [state.success, state.timestamp, refreshCart]);

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'warning';
        enqueueSnackbar(state.message, { variant });
    }, [state.message, state.success, state.timestamp]);

    useEffect(() => {
        setQuantity(initialQuantity);
    }, [initialQuantity]);

    const handleQuantityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setQuantity(parseInt(event.target.value, 10));
    };

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('book-id', bookID);
        formData.append('book-quantity', quantity.toString());
        formData.append('action-type', 'UPDATE');

        startTransition(async () => {
            await formAction(formData);
            await refreshCart();
        });
    };

    return (
        <form
            className="flex gap-2"
            onSubmit={handleSubmit}
        >
            <select
                value={quantity}
                onChange={handleQuantityChange}
                name="book-quantity"
                disabled={isPending}
                className="w-fit rounded-sm border bg-white px-2 py-1 text-black hover:cursor-pointer focus:outline-1 disabled:opacity-50"
            >
                {[...Array(10)].map((_, i) => (
                    <option
                        className="text-black"
                        key={i + 1}
                        value={i + 1}
                    >
                        {i + 1}
                    </option>
                ))}
            </select>

            <button
                className="rounded-am bg-yellow text-gunmetal hover:bg-yellow min-h-12 w-full px-4 font-bold transition-[all-0.2s-ease-out] hover:transform-[scale(1.02)] hover:cursor-pointer disabled:opacity-50"
                disabled={isPending}
            >
                <ShoppingCartOutlinedIcon />
                &nbsp; Update cart
            </button>
        </form>
    );
};
