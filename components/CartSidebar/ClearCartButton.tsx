'use client';

import { CartAction } from '@/data/cart/CartAction';
import { useCartActions } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { enqueueSnackbar } from 'notistack';
import { useActionState, useTransition, useEffect, SyntheticEvent } from 'react';

export const ClearCartButton = () => {
    const { user, loggedIn, profileExists } = useUserState();
    const { refreshCart } = useCartActions();

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    });

    const [isPending, startTransition] = useTransition();

    const isButtonDisabled = !loggedIn || !profileExists || isPending;

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isButtonDisabled) return;

        const formData = new FormData();
        formData.append('action-type', 'CLEAR');

        startTransition(async () => {
            await formAction(formData);
        });
    };

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'warning';
        if (
            !state.success ||
            state.message.toLowerCase().includes('clear') ||
            state.message.toLowerCase().includes('cart')
        )
            enqueueSnackbar(state.message, { variant });

        if (state.success && user?.id) refreshCart(user.id);
    }, [state.message, state.success, state.timestamp, refreshCart, user?.id]);

    return (
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-medium text-gray-500">Cart Items</span>
            <form
                onSubmit={handleSubmit}
                aria-label="clear-cart-form"
            >
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Clear all items from cart"
                >
                    {isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
                    ) : (
                        <DeleteSweepIcon fontSize="small" />
                    )}
                    <span>{isPending ? 'Clearing...' : 'Clear Cart'}</span>
                </button>
            </form>
        </div>
    );
};
