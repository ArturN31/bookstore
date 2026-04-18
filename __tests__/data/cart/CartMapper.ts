import { mapDatabaseCartToDomain } from '@/data/cart/CartMapper';

describe('CartMapper', () => {
    describe('mapDatabaseCartToDomain', () => {
        it('should map database cart with items to domain format', () => {
            const dbCart = {
                id: 'cart-123',
                shopping_cart_items: [
                    {
                        quantity: 2,
                        created_at: '2024-01-01',
                        books: {
                            id: 'book-1',
                            title: 'Test Book',
                            author: 'Test Author',
                            price: '19.99',
                            image_url: '/test.jpg',
                            genre: 'Fiction',
                            stock_quantity: 10,
                            is_active: true,
                        },
                    },
                ],
            };

            const result = mapDatabaseCartToDomain(dbCart);

            expect(result.cartID).toBe('cart-123');
            expect(result.books).toHaveLength(1);
            expect(result.books[0].quantity).toBe(2);
            expect(result.books[0].id).toBe('book-1');
        });

        it('should return empty books array when cart is null', () => {
            const result = mapDatabaseCartToDomain(null);

            expect(result.cartID).toBeNull();
            expect(result.books).toEqual([]);
        });

        it('should return empty books array when cart has no items', () => {
            const dbCart = {
                id: 'cart-123',
                shopping_cart_items: [],
            };

            const result = mapDatabaseCartToDomain(dbCart);

            expect(result.cartID).toBe('cart-123');
            expect(result.books).toEqual([]);
        });

        it('should filter out items with null books', () => {
            const dbCart = {
                id: 'cart-123',
                shopping_cart_items: [
                    {
                        quantity: 2,
                        created_at: '2024-01-01',
                        books: {
                            id: 'book-1',
                            title: 'Test Book',
                        },
                    },
                    {
                        quantity: 1,
                        created_at: '2024-01-01',
                        books: null,
                    },
                ],
            };

            const result = mapDatabaseCartToDomain(dbCart);

            expect(result.books).toHaveLength(1);
            expect(result.books[0].id).toBe('book-1');
        });

        it('should handle undefined input', () => {
            const result = mapDatabaseCartToDomain(undefined);

            expect(result.cartID).toBeNull();
            expect(result.books).toEqual([]);
        });

        it('should handle cart with id but no shopping_cart_items', () => {
            const dbCart = {
                id: 'cart-123',
            };

            const result = mapDatabaseCartToDomain(dbCart as any);

            expect(result.cartID).toBe('cart-123');
            expect(result.books).toEqual([]);
        });
    });
});
