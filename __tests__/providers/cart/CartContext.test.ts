import { INITIAL_CART_STATE, calculateCartTotals } from '@/providers/cart/CartContext';

type CartItems = Parameters<typeof calculateCartTotals>[0];

describe('CartContext', () => {
    describe('INITIAL_CART_STATE', () => {
        it('should have correct initial values', () => {
            expect(INITIAL_CART_STATE.cartBooks).toEqual([]);
            expect(INITIAL_CART_STATE.cartBooksAmount).toBe(0);
            expect(INITIAL_CART_STATE.cartItemsAmount).toBe(0);
            expect(INITIAL_CART_STATE.cartTotal).toBe(0);
            expect(INITIAL_CART_STATE.cartID).toBeNull();
            expect(INITIAL_CART_STATE.loading).toBe(false);
        });
    });

    describe('calculateCartTotals', () => {
        it('should return zeros for empty cart', () => {
            const result = calculateCartTotals([]);

            expect(result).toEqual({
                itemsAmount: 0,
                total: 0,
                booksAmount: 0,
            });
        });

        it('should calculate totals for items with numeric prices', () => {
            const books = [
                { book_id: '1', quantity: 2, price: 10.5 },
                { book_id: '2', quantity: 1, price: 5 },
            ] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(3);
            expect(result.total).toBe(26);
            expect(result.booksAmount).toBe(2);
        });

        it('should calculate totals for items with string prices', () => {
            const books = [{ book_id: '1', quantity: 2, price: '19.99' }] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.total).toBe(39.98);
        });

        it('should handle invalid string prices by defaulting to 0', () => {
            const books = [
                { book_id: '1', quantity: 2, price: 'not-a-number' },
                { book_id: '2', quantity: 1, price: '' },
            ] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.total).toBe(0);
            expect(result.itemsAmount).toBe(3);
        });

        it('should handle missing quantity by defaulting to 0', () => {
            const books = [{ book_id: '1', price: 10 }] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(0);
            expect(result.total).toBe(0);
        });

        it('should handle a mix of numeric and string prices', () => {
            const books = [
                { book_id: '1', quantity: 1, price: 10 },
                { book_id: '2', quantity: 1, price: '10.50' },
            ] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.total).toBe(20.5);
        });

        it('should handle floating point precision correctly', () => {
            const books = [
                { book_id: '1', quantity: 1, price: 0.1 },
                { book_id: '2', quantity: 1, price: 0.2 },
            ] as unknown as CartItems;

            const result = calculateCartTotals(books);

            expect(result.total).toBeCloseTo(0.3);
        });
    });
});
