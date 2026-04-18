import { mapCartData, createInitialCartState } from '@/providers/cart/utils/CartMapper';
import { INITIAL_CART_STATE } from '@/providers/cart/CartContext';

describe('CartMapper', () => {
    describe('mapCartData', () => {
        it('should return empty cart for undefined input', () => {
            const result = mapCartData(undefined as any);

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
            expect(result.cartItemsAmount).toBe(0);
            expect(result.cartTotal).toBe(0);
        });

        it('should return empty cart for null input', () => {
            const result = mapCartData(null as any);

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
        });

        it('should return empty cart for empty array', () => {
            const result = mapCartData([]);

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
            expect(result.cartItemsAmount).toBe(0);
            expect(result.cartTotal).toBe(0);
        });

        it('should map single book correctly', () => {
            const books = [
                {
                    book_id: 'book-1',
                    title: 'Test Book',
                    price: '19.99',
                    quantity: 2,
                },
            ];

            const result = mapCartData(books);

            expect(result.cartBooks).toEqual(books);
            expect(result.cartBooksAmount).toBe(1);
            expect(result.cartItemsAmount).toBe(2);
            expect(result.cartTotal).toBe(39.98);
        });

        it('should map multiple books correctly', () => {
            const books = [
                { book_id: 'book-1', price: '10.00', quantity: 1 },
                { book_id: 'book-2', price: '20.00', quantity: 2 },
            ];

            const result = mapCartData(books);

            expect(result.cartBooksAmount).toBe(2);
            expect(result.cartItemsAmount).toBe(3);
            expect(result.cartTotal).toBe(50.0);
        });

        it('should handle missing quantity (default to 0)', () => {
            const books = [{ book_id: 'book-1', price: '10.00' }];

            const result = mapCartData(books);

            expect(result.cartItemsAmount).toBe(0);
            expect(result.cartTotal).toBe(0);
        });

        it('should handle missing price (default to 0)', () => {
            const books = [{ book_id: 'book-1', quantity: 2 }];

            const result = mapCartData(books);

            expect(result.cartItemsAmount).toBe(2);
            expect(result.cartTotal).toBe(0);
        });

        it('should handle invalid price (parseFloat returns NaN)', () => {
            const books = [{ book_id: 'book-1', price: 'invalid', quantity: 2 }];

            const result = mapCartData(books);

            expect(result.cartTotal).toBeNaN();
        });

        it('should set cartID to empty string', () => {
            const result = mapCartData([]);

            expect(result.cartID).toBe('');
        });

        it('should set loading to false', () => {
            const result = mapCartData([]);

            expect(result.loading).toBe(false);
        });
    });

    describe('createInitialCartState', () => {
        it('should return INITIAL_CART_STATE when initialCart is null', () => {
            const result = createInitialCartState(null);

            expect(result).toEqual(INITIAL_CART_STATE);
        });

        it('should return INITIAL_CART_STATE when initialCart is undefined', () => {
            const result = createInitialCartState(undefined as any);

            expect(result).toEqual(INITIAL_CART_STATE);
        });

        it('should merge initialCart with INITIAL_CART_STATE', () => {
            const initialCart = {
                cartID: 'cart-123',
                cartBooks: [{ book_id: 'book-1' }],
                cartBooksAmount: 1,
                cartItemsAmount: 1,
                cartTotal: 19.99,
            };

            const result = createInitialCartState(initialCart as any);

            expect(result.cartID).toBe('cart-123');
            expect(result.cartBooks).toEqual([{ book_id: 'book-1' }]);
            expect(result.cartBooksAmount).toBe(1);
            expect(result.cartItemsAmount).toBe(1);
            expect(result.cartTotal).toBe(19.99);
        });

        it('should set loading to false regardless of input', () => {
            const initialCart = {
                cartID: 'cart-123',
                loading: true,
            } as any;

            const result = createInitialCartState(initialCart);

            expect(result.loading).toBe(false);
        });

        it('should preserve INITIAL_CART_STATE defaults for missing properties', () => {
            const initialCart = { cartID: 'cart-123' } as any;

            const result = createInitialCartState(initialCart);

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
            expect(result.cartItemsAmount).toBe(0);
            expect(result.cartTotal).toBe(0);
        });
    });
});
