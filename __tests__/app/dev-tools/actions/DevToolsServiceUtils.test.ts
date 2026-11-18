import {
    assertCleanupSucceeded,
    assertInsertedCount,
    assertSalesBatchReferences,
    describeError,
    planWishlistEntries,
    shuffle,
} from '@/app/dev-tools/actions/DevToolsServiceUtils';
import { isCandidateCapacityError } from '@/utils/db/dbSeed/candidatePlanning';

describe('DevToolsServiceUtils', () => {
    it('shuffles without mutating the source array', () => {
        const values = ['a', 'b', 'c', 'd'];

        expect(shuffle(values, () => 0)).toEqual(['b', 'c', 'd', 'a']);
        expect(values).toEqual(['a', 'b', 'c', 'd']);
    });

    describe('assertInsertedCount', () => {
        it('returns rows when the expected count was inserted', () => {
            const rows = [{ id: 'one' }];

            expect(assertInsertedCount({ data: rows, error: null }, 1, 'Book')).toBe(rows);
        });

        it('throws for failed or partial insert results', () => {
            expect(() =>
                assertInsertedCount({ data: null, error: 'write failed' }, 1, 'Book'),
            ).toThrow('Book insert failed: write failed');
            expect(() =>
                assertInsertedCount({ data: [], error: null }, 1, 'Book'),
            ).toThrow('Book insert returned 0 rows; expected 1.');
        });
    });

    it('describes known and unknown errors', () => {
        expect(describeError(new Error('database unavailable'))).toBe('database unavailable');
        expect(describeError('unexpected')).toBe('Unknown error');
    });

    it('returns cleanup failures with their stage names', () => {
        expect(
            assertCleanupSucceeded([
                ['books', { data: [], error: null }],
                ['items', { data: null, error: 'delete denied' }],
            ]),
        ).toEqual(['items: delete denied']);
    });

    describe('assertSalesBatchReferences', () => {
        const books = [{ id: 'book-1', price: '10.00' }];
        const users = [{ id: 'user-1' }];
        const discounts = [
            {
                id: 'discount-1',
                type: 'percentage',
                value: 10,
                is_active: true,
                start_date: '2020-01-01T00:00:00.000Z',
                end_date: '2099-01-01T00:00:00.000Z',
                minimum_subtotal: null,
                usage_limit: 5,
                times_used: 0,
                uses_per_user: null,
            },
        ];
        const orders = [
            {
                id: 'order-1',
                user_id: 'user-1',
                subtotal: 10,
                discount_amount: 0,
                shipping_cost: 2.99,
                tax_amount: 0,
                total_amount: 12.99,
                status: 'pending',
            },
        ];
        const items = [
            {
                id: 'item-1',
                order_id: 'order-1',
                book_id: 'book-1',
                quantity: 1,
                price: 10,
            },
        ];
        const orderDiscounts = [
            { id: 'order-discount-1', order_id: 'order-1', discount_id: 'discount-1' },
        ];

        it('accepts a batch whose references and values are valid', () => {
            expect(() =>
                assertSalesBatchReferences(orders, items, [], books, users, discounts),
            ).not.toThrow();
        });

        it('rejects references and invalid item values outside the preflighted data', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], user_id: 'missing-user' }],
                    items,
                    [],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order batch contains a user outside the preflighted users.');

            expect(() =>
                assertSalesBatchReferences(
                    orders,
                    [{ ...items[0], quantity: 0 }],
                    [],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order-item batch contains an invalid order, book, quantity, or price.');
        });

        it('rejects duplicate IDs and multiple discounts assigned to one order', () => {
            expect(() =>
                assertSalesBatchReferences(
                    orders,
                    [items[0], { ...items[0] }],
                    [],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order-item batch contain duplicate IDs.');

            expect(() =>
                assertSalesBatchReferences(
                    orders,
                    items,
                    [
                        orderDiscounts[0],
                        { ...orderDiscounts[0], id: 'order-discount-2' },
                    ],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order batch contains more than one discount for an order.');
        });

        it('rejects order totals that do not match line items', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], subtotal: 20 }],
                    items,
                    [],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order order-1 subtotal does not match its items.');

            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], total_amount: 99 }],
                    items,
                    [],
                    books,
                    users,
                    discounts,
                ),
            ).toThrow(
                'Order order-1 total does not match its subtotal, discount, shipping, and tax.',
            );
        });

        it('validates discount amount against its referenced discount', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 0.5 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order order-1 discount amount does not match its discount.');
        });

        it('accepts a correctly calculated discount and total', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    discounts,
                ),
            ).not.toThrow();
        });

        it('rejects discounts that are inactive or do not meet their minimum subtotal', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    [{ ...discounts[0], is_active: false }],
                ),
            ).toThrow('Order order-1 applies a discount that is not currently active.');

            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    [{ ...discounts[0], start_date: '2099-01-01T00:00:00.000Z' }],
                ),
            ).toThrow('Order order-1 applies a discount that is not currently active.');

            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    [{ ...discounts[0], end_date: '2020-01-01T00:00:00.000Z' }],
                ),
            ).toThrow('Order order-1 applies a discount that is not currently active.');

            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    [{ ...discounts[0], minimum_subtotal: 15 }],
                ),
            ).toThrow('Order order-1 does not meet the discount minimum subtotal.');
        });

        it('rejects unsupported per-user limits and exhausted usage capacity', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], discount_amount: 1, total_amount: 11.99 }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    [{ ...discounts[0], uses_per_user: 1 }],
                ),
            ).toThrow('Order order-1 applies a discount with an unsupported per-user limit.');

            expect(() =>
                assertSalesBatchReferences(
                    [
                        { ...orders[0], discount_amount: 1, total_amount: 11.99 },
                        {
                            ...orders[0],
                            id: 'order-2',
                            discount_amount: 1,
                            total_amount: 11.99,
                        },
                    ],
                    [
                        items[0],
                        { ...items[0], id: 'item-2', order_id: 'order-2' },
                    ],
                    [
                        orderDiscounts[0],
                        { ...orderDiscounts[0], id: 'order-discount-2', order_id: 'order-2' },
                    ],
                    books,
                    users,
                    [{ ...discounts[0], usage_limit: 1 }],
                ),
            ).toThrow(
                'Discount discount-1 has insufficient remaining usage capacity for the batch.',
            );
        });

        it('rejects discounts attached to failed or cancelled orders', () => {
            expect(() =>
                assertSalesBatchReferences(
                    [{ ...orders[0], status: 'cancelled' }],
                    items,
                    orderDiscounts,
                    books,
                    users,
                    discounts,
                ),
            ).toThrow('Order order-1 cannot apply a discount in its cancelled status.');
        });

        it('rejects empty order compositions and invalid book prices', () => {
            expect(() =>
                assertSalesBatchReferences(orders, [], [], books, users, discounts),
            ).toThrow('Order order-1 must contain at least one item.');

            expect(() =>
                assertSalesBatchReferences(
                    orders,
                    items,
                    [],
                    [{ id: 'book-1', price: 'not-a-price' }],
                    users,
                    discounts,
                ),
            ).toThrow('Book price must be a non-negative number.');
        });
    });

    describe('planWishlistEntries', () => {
        it('plans exact unique pairs while excluding existing entries and duplicate IDs', () => {
            const result = planWishlistEntries(
                [{ id: 'user-1' }, { id: 'user-1' }, { id: 'user-2' }],
                [{ id: 'book-1' }, { id: 'book-2' }],
                [{ user_id: 'user-1', book_id: 'book-1' }],
                3,
                () => 0,
            );

            expect(result).toHaveLength(3);
            expect(new Set(result.map(({ user_id, book_id }) => `${user_id}:${book_id}`)).size).toBe(
                3,
            );
            expect(result).not.toContain({ user_id: 'user-1', book_id: 'book-1' });
        });

        it('reports exact available capacity when the requested count cannot be met', () => {
            let error: unknown;

            try {
                planWishlistEntries(
                    [{ id: 'user-1' }],
                    [{ id: 'book-1' }, { id: 'book-2' }],
                    [
                        { user_id: 'user-1', book_id: 'book-1' },
                        { user_id: 'user-1', book_id: 'book-2' },
                        { user_id: 'user-1', book_id: 'book-2' },
                    ],
                    1,
                );
            } catch (caught) {
                error = caught;
            }

            expect(isCandidateCapacityError(error)).toBe(true);
            expect(error).toMatchObject({ requestedCount: 1, availableCount: 0 });
        });

        it('samples a small batch from a large pair space without expanding it', () => {
            const users = Array.from({ length: 10_000 }, (_, index) => ({ id: `user-${index}` }));
            const books = Array.from({ length: 10_000 }, (_, index) => ({ id: `book-${index}` }));

            const result = planWishlistEntries(users, books, [], 5, () => 0);

            expect(result).toHaveLength(5);
            expect(new Set(result.map(({ user_id, book_id }) => `${user_id}:${book_id}`)).size).toBe(
                5,
            );
        });
    });
});
