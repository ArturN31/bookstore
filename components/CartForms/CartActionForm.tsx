import { useActionState, useEffect, useMemo } from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import RemoveShoppingCartOutlinedIcon from '@mui/icons-material/RemoveShoppingCartOutlined';
import { useUserState } from '@/providers/user/utils/useUser';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { enqueueSnackbar } from 'notistack';
import { CartAction, CartFormState } from '@/data/actions/CartForm/CartAction';

export const CartActionForm = ({ bookID, stock }: { bookID: string; stock: number }) => {
    const { loggedIn, profileExists, loading: userLoading } = useUserState();
    const { cartBooks, cartBooksAmount } = useCartState();
    const { refreshCart } = useCartActions();

    const isInCart = useMemo(
        () => cartBooks.some((book) => String(book.id) === String(bookID)),
        [cartBooks, bookID],
    );

    const initialState: CartFormState = { success: false, message: '' };

    const [state, formAction, isPending] = useActionState(
        async (prevState: CartFormState, formData: FormData) => {
            if (isPending) return prevState;
            const result = await CartAction(prevState, formData);
            if (result.success) await refreshCart();
            return result;
        },
        initialState,
    );

    const isAddMode = !isInCart;
    const isCartFull = cartBooksAmount >= 10;
    const isButtonDisabled =
        (!userLoading && (!loggedIn || !profileExists || (isAddMode && isCartFull))) || stock === 0;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        if (isButtonDisabled || isPending) {
            event.preventDefault();
            return;
        }
    };

    useEffect(() => {
        if (!state.message) return;

        const variant = state.success ? 'success' : 'warning';
        enqueueSnackbar(state.message, { variant });
    }, [state.message, state.success, state.timestamp]);

    const buttonStyles = isAddMode
        ? 'bg-yellow text-gunmetal hover:bg-yellow/90'
        : 'border border-yellow text-yellow hover:bg-yellow/10';

    return (
        <div className="grid gap-2">
            <form
                action={formAction}
                onSubmit={handleSubmit}
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
                    value={isAddMode ? 'INSERT' : 'REMOVE'}
                />

                <input
                    type="hidden"
                    name="book-quantity"
                    value="1"
                />

                <button
                    type="submit"
                    disabled={isButtonDisabled || isPending}
                    onClick={(e) => e.stopPropagation()}
                    className={`min-h-12 w-full rounded-sm px-2 font-bold transition-all ${
                        isPending ? 'cursor-wait opacity-70' : 'cursor-pointer hover:scale-[1.02]'
                    } disabled:transform-none disabled:bg-[#b3b3b3] disabled:text-[#666] ${buttonStyles}`}
                >
                    {isAddMode ? <ShoppingCartOutlinedIcon /> : <RemoveShoppingCartOutlinedIcon />}
                    &nbsp;
                    {isPending ? 'Processing...' : isAddMode ? 'Add to cart' : 'Remove from cart'}
                </button>
            </form>

            {!userLoading && (
                <div className="text-center text-xs text-gray-400">
                    {!loggedIn && <p>Sign in to use cart</p>}
                    {stock === 0 && <p>Out of stock</p>}
                    {loggedIn && !profileExists && <p>Complete your user profile</p>}
                </div>
            )}

            {isCartFull && isAddMode && (
                <div className="text-center text-xs text-red-400">
                    <p>Cart is full (Max 10 items)</p>
                </div>
            )}
        </div>
    );
};
