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
        const books = [{ id: 'book-1' }];
        const users = [{ id: 'user-1' }];
        const discounts = [{ id: 'discount-1' }];
        const orders = [{ id: 'order-1', user_id: 'user-1' }];
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
                assertSalesBatchReferences(orders, items, orderDiscounts, books, users, discounts),
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
