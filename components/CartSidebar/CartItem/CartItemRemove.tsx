'use client';

import { CartAction } from '@/data/actions/CartForm/CartAction';
import { useCartActions } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { enqueueSnackbar } from 'notistack';
import { useState, useActionState, useTransition, useEffect, SyntheticEvent } from 'react';

export const CartItemRemove = ({ book }: { book: Book }) => {
    const { user, loggedIn, profileExists } = useUserState();
    const { refreshCart } = useCartActions();

    const [state, formAction] = useActionState(CartAction, {
        success: false,
        message: '',
    });

    const [isPending, startTransition] = useTransition();
    const [hover, setHover] = useState(false);

    const isButtonDisabled = !loggedIn || !profileExists || isPending;

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isButtonDisabled) return;

        const formData = new FormData();
        formData.append('book-id', book.id);
        formData.append('action-type', 'REMOVE');

        startTransition(async () => {
            await formAction(formData);
        });
    };

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'warning';
        if (!state.success || state.message.includes('removed')) {
            enqueueSnackbar(state.message, { variant });
        }

        if (state.success) {
            refreshCart(user.id);
        }
    }, [state.message, state.success, state.timestamp, refreshCart, user?.id]);

    return (
        <div className="grid gap-2">
            <form
                onSubmit={handleSubmit}
                aria-label="remove-item-form"
            >
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="mx-2 grid place-items-center transition-all duration-200 hover:scale-115 hover:cursor-pointer disabled:transform-none disabled:text-gray-500"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    aria-label={`Remove ${book.title} from cart`}
                >
                    {isPending ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : hover ? (
                        <DeleteForeverIcon />
                    ) : (
                        <DeleteIcon />
                    )}
                </button>
            </form>
        </div>
    );
};
