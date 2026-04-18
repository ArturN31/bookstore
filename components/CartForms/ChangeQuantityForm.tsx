'use client';

import React, { useActionState, useEffect, useState, useTransition } from 'react';
import { enqueueSnackbar } from 'notistack';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { CartAction, CartFormState } from '@/data/actions/CartForm/CartAction';

interface ChangeQuantityFormProps {
    bookID: string;
}

export const ChangeQuantityForm = ({ bookID }: ChangeQuantityFormProps) => {
    const { cartBooks } = useCartState();
    const { refreshCart } = useCartActions();

    const currentBook = cartBooks.find((cartBook) => cartBook.id === bookID);
    const initialQuantity = currentBook?.quantity || 1;

    const [quantity, setQuantity] = useState(initialQuantity);
    const [isPending, startTransition] = useTransition();

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    } as CartFormState);

    // Synchronize local select state with global cart state updates
    useEffect(() => {
        setQuantity(initialQuantity);
    }, [initialQuantity]);

    // Centralized side-effect handler for server action results
    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'error';
        enqueueSnackbar(state.message, { variant });

        if (state.success) {
            refreshCart();
        }
    }, [state.message, state.success, state.timestamp, refreshCart]);

    const isChanged = quantity !== initialQuantity;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Production guard: prevent redundant or overlapping submissions
        if (!isChanged || isPending) return;

        const formData = new FormData();
        formData.append('book-id', bookID);
        formData.append('book-quantity', quantity.toString());
        formData.append('action-type', 'UPDATE');

        startTransition(async () => {
            await formAction(formData);
        });
    };

    return (
        <form
            className="flex items-center justify-center gap-2"
            onSubmit={handleSubmit}
            aria-label={`Update quantity for ${currentBook?.title || 'book'}`}
        >
            <div className="relative">
                <select
                    id={`qty-select-${bookID}`}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    name="book-quantity"
                    disabled={isPending}
                    aria-label="Select quantity"
                    className="h-10 w-20 cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {Array.from({ length: 10 }, (_, i) => (
                        <option
                            key={i + 1}
                            value={i + 1}
                        >
                            {i + 1}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={isPending || !isChanged}
                className="group text-gunmetal relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 font-bold shadow-sm transition-all hover:bg-yellow-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            >
                {isPending ? (
                    <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"
                        aria-hidden="true"
                    />
                ) : (
                    <ShoppingCartOutlinedIcon fontSize="small" />
                )}

                <span className="whitespace-nowrap">
                    {isPending ? 'Updating...' : isChanged ? 'Update cart' : 'Saved'}
                </span>
            </button>
        </form>
    );
};
