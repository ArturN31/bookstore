import { cartReducer } from '@/providers/cart/CartReducer';
import { INITIAL_CART_STATE, calculateCartTotals } from '@/providers/cart/CartContext';

jest.mock('@/providers/cart/CartContext', () => {
    const actual = jest.requireActual('@/providers/cart/CartContext');
    return {
        ...actual,
        calculateCartTotals: jest.fn(() => ({
            itemsAmount: 1,
            total: 19.99,
            booksAmount: 1,
        })),
    };
});

describe('CartReducer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('START_LOADING', () => {
        it('should set loading to true', () => {
            const state = { ...INITIAL_CART_STATE, loading: false };
            const action = { type: 'START_LOADING' as const };

            const newState = cartReducer(state, action);

            expect(newState.loading).toBe(true);
        });
    });

    describe('SET_CART_DATA', () => {
        it('should update cart with payload data', () => {
            const state = { ...INITIAL_CART_STATE };
            const action = {
                type: 'SET_CART_DATA' as const,
                payload: {
                    cartID: 'cart-123',
                    books: [{ book_id: 'book-1', quantity: 2 }],
                },
            };

            const newState = cartReducer(state, action);

            expect(newState.cartID).toBe('cart-123');
            expect(newState.cartBooks).toEqual([{ book_id: 'book-1', quantity: 2 }]);
            expect(newState.loading).toBe(false);
        });

        it('should call calculateCartTotals with books', () => {
            const state = { ...INITIAL_CART_STATE };
            const books = [{ book_id: 'book-1', quantity: 2 }];
            const action = {
                type: 'SET_CART_DATA' as const,
                payload: { cartID: 'cart-123', books },
            };

            cartReducer(state, action);

            expect(calculateCartTotals).toHaveBeenCalledWith(books);
        });

        it('should set cartBooksAmount from calculated totals', () => {
            (calculateCartTotals as jest.Mock).mockReturnValue({
                itemsAmount: 3,
                total: 59.97,
                booksAmount: 2,
            });

            const state = { ...INITIAL_CART_STATE };
            const action = {
                type: 'SET_CART_DATA' as const,
                payload: { cartID: 'cart-123', books: [] },
            };

            const newState = cartReducer(state, action);

            expect(newState.cartBooksAmount).toBe(2);
            expect(newState.cartItemsAmount).toBe(3);
            expect(newState.cartTotal).toBe(59.97);
        });
    });

    describe('RESET_CART', () => {
        it('should return INITIAL_CART_STATE', () => {
            const state = {
                ...INITIAL_CART_STATE,
                cartID: 'cart-123',
                cartBooks: [{ book_id: 'book-1', quantity: 1 }],
                cartBooksAmount: 1,
                cartItemsAmount: 1,
                cartTotal: 19.99,
                loading: false,
            };
            const action = { type: 'RESET_CART' as const };

            const newState = cartReducer(state, action);

            expect(newState).toEqual(INITIAL_CART_STATE);
        });
    });

    describe('SET_ERROR', () => {
        it('should set loading to false', () => {
            const state = { ...INITIAL_CART_STATE, loading: true };
            const action = { type: 'SET_ERROR' as const };

            const newState = cartReducer(state, action);

            expect(newState.loading).toBe(false);
        });

        it('should preserve other state properties', () => {
            const state = {
                ...INITIAL_CART_STATE,
                cartID: 'cart-123',
                loading: true,
            };
            const action = { type: 'SET_ERROR' as const };

            const newState = cartReducer(state, action);

            expect(newState.cartID).toBe('cart-123');
            expect(newState.loading).toBe(false);
        });
    });

    describe('default case', () => {
        it('should return state unchanged for unknown action', () => {
            const state = { ...INITIAL_CART_STATE, cartID: 'test-123' };
            const action = { type: 'UNKNOWN_ACTION' as any };

            const newState = cartReducer(state, action);

            expect(newState).toEqual(state);
        });
    });
});
