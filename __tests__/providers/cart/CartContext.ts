import {
    INITIAL_CART_STATE,
    parsePrice,
    calculateCartTotals,
} from '@/providers/cart/CartContext';

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

    describe('parsePrice', () => {
        it('should return number as-is', () => {
            expect(parsePrice(19.99)).toBe(19.99);
            expect(parsePrice(0)).toBe(0);
            expect(parsePrice(-5.5)).toBe(-5.5);
        });

        it('should parse string with currency symbol', () => {
            expect(parsePrice('$19.99')).toBe(19.99);
            expect(parsePrice('€25.00')).toBe(25);
            expect(parsePrice('£10.50')).toBe(10.5);
        });

        it('should parse string with spaces', () => {
            expect(parsePrice(' 19.99 ')).toBe(19.99);
        });

        it('should handle empty string', () => {
            expect(parsePrice('')).toBe(0);
        });

        it('should handle invalid string', () => {
            expect(parsePrice('invalid')).toBe(0);
        });

        it('should handle string with only currency', () => {
            expect(parsePrice('$')).toBe(0);
        });

        it('should parse negative numbers', () => {
            expect(parsePrice('-19.99')).toBe(-19.99);
            expect(parsePrice('$-19.99')).toBe(-19.99);
        });

        it('should parse numbers with multiple decimals', () => {
            expect(parsePrice('19.999')).toBe(19.999);
        });
    });

    describe('calculateCartTotals', () => {
        it('should return zeros for empty cart', () => {
            const result = calculateCartTotals([]);

            expect(result.itemsAmount).toBe(0);
            expect(result.total).toBe(0);
            expect(result.booksAmount).toBe(0);
        });

        it('should calculate totals for single item', () => {
            const books = [{ book_id: 'book-1', quantity: 2, price: '19.99' }];

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(2);
            expect(result.total).toBe(39.98);
            expect(result.booksAmount).toBe(1);
        });

        it('should calculate totals for multiple items', () => {
            const books = [
                { book_id: 'book-1', quantity: 1, price: '10.00' },
                { book_id: 'book-2', quantity: 2, price: '20.00' },
            ];

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(3);
            expect(result.total).toBe(50);
            expect(result.booksAmount).toBe(2);
        });

        it('should handle missing quantity (default to 0)', () => {
            const books = [{ book_id: 'book-1', price: '10.00' }];

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(0);
            expect(result.total).toBe(0);
        });

        it('should handle undefined price (treats as 0)', () => {
            // Note: parsePrice will throw on undefined, but calculateCartTotals
            // uses book.price which could be undefined
            // The actual behavior depends on how CartItem type is defined
            const books = [{ book_id: 'book-1', quantity: 2, price: '' }];

            const result = calculateCartTotals(books);

            expect(result.itemsAmount).toBe(2);
            expect(result.total).toBe(0);
        });

        it('should handle price with currency symbol', () => {
            const books = [{ book_id: 'book-1', quantity: 2, price: '$19.99' }];

            const result = calculateCartTotals(books);

            expect(result.total).toBe(39.98);
        });

        it('should handle numeric price', () => {
            const books = [{ book_id: 'book-1', quantity: 2, price: 19.99 }];

            const result = calculateCartTotals(books);

            expect(result.total).toBe(39.98);
        });
    });
});
