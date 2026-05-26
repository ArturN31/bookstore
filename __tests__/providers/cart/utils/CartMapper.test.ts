import { INITIAL_CART_STATE } from '@/providers/cart/CartContext';
import { createInitialCartState, mapCartData } from '@/providers/cart/utils/CartMapper';

type CartBook = Cart['cartBooks'][number];

describe('Provider Layer CartMapper', () => {
    describe('createInitialCartState', () => {
        it('should return INITIAL_CART_STATE when initialCart is null', () => {
            const result = createInitialCartState(null);

            expect(result).toEqual(INITIAL_CART_STATE);
        });

        it('should return INITIAL_CART_STATE when initialCart is undefined', () => {
            const result = createInitialCartState(undefined as unknown as null);

            expect(result).toEqual(INITIAL_CART_STATE);
        });

        it('should merge initialCart with INITIAL_CART_STATE', () => {
            const initialCart = {
                cartID: 'cart-123',
                cartBooks: [{ book_id: 'book-1', price: '10.00', quantity: 1 }],
                cartBooksAmount: 1,
                cartItemsAmount: 1,
                cartTotal: 10,
            };

            const result = createInitialCartState(initialCart as unknown as Cart);

            expect(result.cartID).toBe('cart-123');
            expect(result.cartBooks).toHaveLength(1);
            expect(result.cartTotal).toBe(10);
        });

        it('should force loading to false regardless of input state', () => {
            const initialCart = {
                cartID: 'cart-123',
                loading: true,
            };

            const result = createInitialCartState(initialCart as unknown as Cart);

            expect(result.loading).toBe(false);
        });

        it('should preserve INITIAL_CART_STATE defaults for missing properties', () => {
            const initialCart = { cartID: 'cart-123' };

            const result = createInitialCartState(initialCart as unknown as Cart);

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
            expect(result.cartTotal).toBe(0);
        });
    });

    describe('mapCartData', () => {
        it('should default to empty array when no arguments are provided', () => {
            const result = mapCartData();

            expect(result.cartBooks).toEqual([]);
            expect(result.cartBooksAmount).toBe(0);
        });

        it('should handle explicit null payloads via nullish coalescing safely', () => {
            const result = mapCartData(null as unknown as CartBook[]);

            expect(result).toEqual({
                cartID: '',
                cartBooks: [],
                cartBooksAmount: 0,
                cartItemsAmount: 0,
                cartTotal: 0,
                loading: false,
            });
        });

        it('should correctly sum item amounts and calculate numeric prices from string representations', () => {
            const mockBooks = [
                { id: 'book-1', price: '12.50', quantity: 2 },
                { id: 'book-2', price: '5.00', quantity: 1 },
            ] as unknown as CartBook[];

            const result = mapCartData(mockBooks);

            expect(result.cartBooksAmount).toBe(2);
            expect(result.cartItemsAmount).toBe(3);
            expect(result.cartTotal).toBe(30.0);
        });

        it('should secure calculations against missing price or quantity properties', () => {
            const mockBooks = [
                { id: 'book-1', quantity: 2 },
                { id: 'book-2', price: '15.00' },
            ] as unknown as CartBook[];

            const result = mapCartData(mockBooks);

            expect(result.cartBooksAmount).toBe(2);
            expect(result.cartItemsAmount).toBe(2);
            expect(result.cartTotal).toBe(0);
        });
    });
});
