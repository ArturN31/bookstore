import { calculateCartTotals, CartAction, INITIAL_CART_STATE } from './CartContext';

export function cartReducer(state: Cart, action: CartAction): Cart {
    switch (action.type) {
        case 'START_LOADING':
            return { ...state, loading: true };

        case 'SET_CART_DATA': {
            const { itemsAmount, total, booksAmount } = calculateCartTotals(action.payload.books);

            return {
                ...state,
                cartID: action.payload.cartID,
                cartBooks: [...action.payload.books],
                cartBooksAmount: booksAmount,
                cartItemsAmount: itemsAmount,
                cartTotal: total,
                loading: false,
            };
        }

        case 'RESET_CART':
            return INITIAL_CART_STATE;

        case 'SET_ERROR':
            return { ...state, loading: false };

        default:
            return state;
    }
}
