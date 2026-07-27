// CartActionForm.tsx
'use client';

import { useActionState, useEffect, useMemo, useOptimistic, startTransition } from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import RemoveShoppingCartOutlinedIcon from '@mui/icons-material/RemoveShoppingCartOutlined';
import { useUserState } from '@/providers/user/utils/useUser';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { enqueueSnackbar } from 'notistack';
import { CartAction, CartFormState } from '@/data/actions/CartForm/CartAction';

export const CartActionForm = ({ bookID, stock }: { bookID: string; stock: number }) => {
    const { user, loggedIn, profileExists, loading: userLoading } = useUserState();
    const { cartBooks, cartBooksAmount } = useCartState();
    const { refreshCart } = useCartActions();

    const isInCart = useMemo(
        () => cartBooks.some((book) => String(book.id) === String(bookID)),
        [cartBooks, bookID],
    );

    const [optimisticInCart, setOptimisticInCart] = useOptimistic(
        isInCart,
        (_, next: boolean) => next,
    );

    const initialState: CartFormState = { success: false, message: '' };

    const [state, formAction] = useActionState(
        async (prevState: CartFormState, formData: FormData) => {
            const result = await CartAction(prevState, formData);
            if (result.success) await refreshCart(user.id);
            return result;
        },
        initialState,
    );

    const isAddMode = !optimisticInCart;
    const isCartFull = cartBooksAmount >= 10;
    const isOutOfStock = stock === 0;
    const isLowStock = stock > 0 && stock <= 25;

    const isButtonDisabled =
        (!userLoading && (!loggedIn || !profileExists || (isAddMode && isCartFull))) ||
        isOutOfStock;

    useEffect(() => {
        if (!state.message) return;
        const variant = state.success ? 'success' : 'error';
        enqueueSnackbar(state.message, { variant });
    }, [state.message, state.success, state.timestamp]);

    const handleAction = (formData: FormData) => {
        startTransition(() => {
            setOptimisticInCart(!isInCart);
            formAction(formData);
        });
    };

    const getStatusContent = () => {
        if (userLoading) return null;
        if (isOutOfStock) return { text: 'Out of stock', color: 'text-slate-400', animate: false };
        if (!loggedIn)
            return { text: 'Sign in to use cart', color: 'text-gray-400', animate: false };
        if (loggedIn && !profileExists)
            return { text: 'Complete your user profile', color: 'text-gray-400', animate: false };
        if (isCartFull && isAddMode)
            return { text: 'Cart is full (Max 10 items)', color: 'text-red-400', animate: false };
        if (isLowStock && isAddMode)
            return { text: `Limited Stock: ${stock} left`, color: 'text-red-500', animate: true };
        return null;
    };

    const status = getStatusContent();

    const buttonStyles = isAddMode
        ? 'bg-yellow text-gunmetal hover:bg-yellow/90'
        : 'border border-yellow text-yellow hover:bg-yellow/10';

    return (
        <div className="flex w-full flex-col">
            <form
                action={handleAction}
                onSubmit={(e) => {
                    if (isButtonDisabled) e.preventDefault();
                    e.stopPropagation();
                }}
                className="mt-1"
                aria-label="cart-form"
            >
                <input
                    type="hidden"
                    name="book-id"
                    value={bookID}
                />
                <input
                    type="hidden"
                    name="action-type"
                    value={!isInCart ? 'INSERT' : 'REMOVE'}
                />
                <input
                    type="hidden"
                    name="book-quantity"
                    value="1"
                />

                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className={`flex min-h-12 w-full cursor-pointer items-center justify-center rounded-sm px-2 font-bold transition-all hover:scale-[1.02] disabled:transform-none disabled:bg-[#b3b3b3] disabled:text-[#666] ${buttonStyles} 4k:min-h-24 4k:text-3xl}`}
                >
                    <div className="flex items-center gap-2">
                        {isAddMode ? (
                            <ShoppingCartOutlinedIcon />
                        ) : (
                            <RemoveShoppingCartOutlinedIcon />
                        )}
                        <span>{isAddMode ? 'Add to cart' : 'Remove from cart'}</span>
                    </div>
                </button>
            </form>
            {status && (
                <div className="4k:h-10 flex h-5 items-center justify-center">
                    {status ? (
                        <p
                            className={`4k:text-xl text-[10px] font-bold tracking-tight uppercase ${status.color} ${status.animate ? 'animate-pulse' : ''}`}
                        >
                            {status.text}
                        </p>
                    ) : (
                        <div className="h-px w-4 bg-transparent" />
                    )}
                </div>
            )}
        </div>
    );
};
