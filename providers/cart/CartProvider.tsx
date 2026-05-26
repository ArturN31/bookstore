'use client';
import React, { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { createFrontendClient } from '@/utils/db/client';
import { CartStateContext, CartActionsContext } from '@/providers/cart/CartContext';
import { cartReducer } from '@/providers/cart/CartReducer';
import { createInitialCartState } from '@/providers/cart/utils/CartMapper';
import { useCartListeners } from '@/providers/cart/utils/useCartListeners';
import { getCartData } from '@/data/cart/GetCartData';
import { useUserState } from '@/providers/user/utils/useUser';

interface CartProviderProps {
    initialCart: Cart | null;
    children: React.ReactNode;
}

export const CartProvider = ({ initialCart, children }: CartProviderProps) => {
    const supabase = useMemo(() => createFrontendClient(), []);
    const { user } = useUserState();
    const [state, dispatch] = useReducer(cartReducer, createInitialCartState(initialCart));
    const activeUserId = useRef<string | null>(user?.id ?? null);

    useEffect(() => {
        activeUserId.current = user?.id ?? null;
    }, [user?.id]);

    const refreshCart = useCallback(async (userId?: string) => {
        const targetId = userId || activeUserId.current;
        if (!targetId) return;

        activeUserId.current = targetId;
        dispatch({ type: 'START_LOADING' });

        try {
            const response = await getCartData(targetId);

            if (response.error) throw new Error(response.error);

            if (activeUserId.current === targetId) {
                dispatch({
                    type: 'SET_CART_DATA',
                    payload: {
                        cartID: response.data?.cartID ?? null,
                        books: response.data?.books ?? [],
                    },
                });
            }
        } catch (err) {
            console.error('Cart Refresh Failed:', err);
            if (activeUserId.current === targetId) dispatch({ type: 'SET_ERROR' });
        }
    }, []);

    const resetCart = useCallback(() => {
        activeUserId.current = null;
        dispatch({ type: 'RESET_CART' });
    }, []);

    useCartListeners({
        supabase,
        cartID: state.cartID,
        onCartChange: () => {
            if (activeUserId.current) refreshCart(activeUserId.current);
        },
    });

    const actions = useMemo(() => ({ refreshCart, resetCart }), [refreshCart, resetCart]);

    return (
        <CartActionsContext.Provider value={actions}>
            <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
        </CartActionsContext.Provider>
    );
};
