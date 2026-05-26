'use client';
import { createContext } from 'react';

export const INITIAL_CART_STATE: Cart = {
    cartBooks: [],
    cartBooksAmount: 0,
    cartItemsAmount: 0,
    cartTotal: 0,
    cartID: null,
    loading: false,
};

export const calculateCartTotals = (books: CartItem[]) => {
    const itemsAmount = books.reduce((sum, book) => sum + (book.quantity || 0), 0);
    const totalValue = books.reduce((sum, book) => {
        const price = typeof book.price === 'number' ? book.price : parseFloat(book.price) || 0;
        return sum + (book.quantity || 0) * price;
    }, 0);
    return {
        itemsAmount,
        total: totalValue,
        booksAmount: books.length,
    };
};

export type CartActions = {
    refreshCart: (userId: string) => Promise<void>;
    resetCart: () => void;
};

export type CartAction =
    | { type: 'START_LOADING' }
    | { type: 'SET_CART_DATA'; payload: { cartID: string | null; books: CartItem[] } }
    | { type: 'SET_ERROR' }
    | { type: 'RESET_CART' };

export const CartStateContext = createContext<Cart | undefined>(undefined);
export const CartActionsContext = createContext<CartActions | undefined>(undefined);
