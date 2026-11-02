import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    let uuid = 0;

    return {
        faker: {
            helpers: { arrayElement: (values: unknown[]) => values[0] },
            number: { int: () => 1 },
            string: {
                uuid: () => `generated-${uuid++}`,
                alphanumeric: () => 'payment-token',
            },
            date: { recent: () => new Date('2026-01-01T00:00:00.000Z') },
        },
    };
});

describe('generateOrdersAndItems', () => {
    it('uses the supplied current user IDs for generated orders', () => {
        const books = [
            {
                id: 'book-1',
                price: '12.00',
            },
        ] as BookDB[];

        const { orders, items } = generateOrdersAndItems(
            books,
            [{ id: 'current-user' }],
            1,
            1,
            [],
            0,
        );

        expect(orders).toHaveLength(1);
        expect(orders[0].user_id).toBe('current-user');
        expect(items).toHaveLength(1);
        expect(items[0].book_id).toBe('book-1');
        expect(items[0].order_id).toBe(orders[0].id);
    });

    it('rejects orders when there are no current users', () => {
        expect(() =>
            generateOrdersAndItems(
                [{ id: 'book-1', price: '12.00' } as BookDB],
                [],
                1,
                1,
                [],
                0,
            ),
        ).toThrow('At least one current user is required to generate orders.');
    });
});
