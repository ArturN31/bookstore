import { INITIAL_CART_STATE } from '@/providers/cart/CartContext';

type CartBook = Cart['cartBooks'][number];

/**
 * Transforms raw book data and totals into a valid Cart state.
 */
export const mapCartData = (books: CartBook[] = []): Cart => {
    const booksArray = books ?? [];

    const cartBooksAmount = booksArray.length;
    const cartItemsAmount = booksArray.reduce((sum, book) => sum + (book.quantity || 0), 0);
    const cartTotal = booksArray.reduce(
        (sum, book) => sum + parseFloat(String(book.price || '0')) * (book.quantity || 0),
        0,
    );

    return {
        cartID: '',
        cartBooks: booksArray,
        cartBooksAmount,
        cartItemsAmount,
        cartTotal,
        loading: false,
    };
};

/**
 * Creates the starting state for the Cart provider.
 */
export const createInitialCartState = (initialCart: Cart | null): Cart => {
    if (!initialCart) return INITIAL_CART_STATE;

    return {
        ...INITIAL_CART_STATE,
        ...initialCart,
        loading: false,
    };
};
