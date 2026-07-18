'use client';

import { useActionState, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
import { enqueueSnackbar } from 'notistack';

import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { CartAction, CartFormState } from '@/data/actions/CartForm/CartAction';
import { useUserState } from '@/providers/user/utils/useUser';

interface ChangeQuantityFormProps {
    bookID: string;
}

export const ChangeQuantityForm = ({ bookID }: ChangeQuantityFormProps) => {
    const { cartBooks } = useCartState();
    const { refreshCart } = useCartActions();
    const { user } = useUserState();

    const currentBook = useMemo(
        () => cartBooks.find((cartBook) => cartBook.id === bookID),
        [cartBooks, bookID],
    );
    const currentBookQuantity = currentBook?.quantity || 1;

    const [optimisticQuantity, setOptimisticQuantity] = useOptimistic(
        currentBookQuantity,
        (_, next: number) => next,
    );

    const [isPending, startTransition] = useTransition();

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    } as CartFormState);

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'error';
        enqueueSnackbar(state.message, { variant });

        if (state.success) refreshCart(user.id);
    }, [state.message, state.success, state.timestamp, refreshCart, user.id]);

    const handleChange = async (newQuantity: number) => {
        if (isPending) return;

        startTransition(() => {
            setOptimisticQuantity(newQuantity);
        });

        const formData = new FormData();
        formData.append('book-id', bookID);
        formData.append('book-quantity', newQuantity.toString());
        formData.append('action-type', 'UPDATE');

        startTransition(async () => {
            await formAction(formData);
        });
    };

    return (
        <div className="relative mx-auto inline-block h-10 w-20">
            <select
                id={`qty-select-${bookID}`}
                value={
                    currentBookQuantity !== optimisticQuantity
                        ? optimisticQuantity
                        : currentBookQuantity
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleChange(parseInt(e.target.value, 10))
                }
                name="book-quantity"
                disabled={isPending}
                aria-label="Select quantity"
                className="h-full w-full cursor-pointer appearance-none rounded-md border border-slate-300 bg-white text-center text-slate-900 shadow-sm transition-all hover:border-slate-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
                {Array.from({ length: 10 }, (_, i) => (
                    <option
                        key={i + 1}
                        value={i + 1}
                        className="text-center"
                    >
                        {i + 1}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500">
                <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </div>
    );
};
