'use client';
import { useContext } from 'react';
import { CartActionsContext, CartStateContext } from '../CartContext';

export const useCartState = () => {
    const context = useContext(CartStateContext);
    if (!context) throw new Error('useCartState must be used within CartProvider');
    return context;
};

export const useCartActions = () => {
    const context = useContext(CartActionsContext);
    if (!context) throw new Error('useCartActions must be used within CartProvider');
    return context;
};
