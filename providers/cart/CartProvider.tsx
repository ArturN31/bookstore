'use client';
import React, { useReducer, useMemo, useCallback } from 'react';
import { createFrontendClient } from '@/utils/db/client';
import { CartStateContext, CartActionsContext } from '@/providers/cart/CartContext';
import { cartReducer } from '@/providers/cart/CartReducer';
import { useUserState } from '@/providers/user/utils/useUser';
import { createInitialCartState } from '@/providers/cart/utils/CartMapper';
import { useCartListeners } from '@/providers/cart/utils/useCartListeners';
import { getCartData } from '@/data/cart/GetCartData';

interface CartProviderProps {
    initialCart: Cart | null;
    children: React.ReactNode;
}

export const CartProvider = ({ initialCart, children }: CartProviderProps) => {
    const { user, loggedIn } = useUserState();
    const supabase = useMemo(() => createFrontendClient(), []);

    const [state, dispatch] = useReducer(cartReducer, createInitialCartState(initialCart));

    const refreshCart = useCallback(async () => {
        if (!user?.id) return;

        try {
            dispatch({ type: 'START_LOADING' });

            const { cartID, books, error } = await getCartData(user.id);

            if (error) throw error;

            dispatch({ type: 'SET_CART_DATA', payload: { cartID, books } });
        } catch (err) {
            console.error('Cart Refresh Failed:', err);
            dispatch({ type: 'SET_ERROR' });
        }
    }, [user?.id, supabase]);

    useCartListeners({
        supabase,
        cartID: state.cartID,
        loggedIn,
        refreshCart,
        resetCart: () => dispatch({ type: 'RESET_CART' }),
    });

    const actions = useMemo(() => ({ refreshCart }), [refreshCart]);

    return (
        <CartActionsContext.Provider value={actions}>
            <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
        </CartActionsContext.Provider>
    );
};
