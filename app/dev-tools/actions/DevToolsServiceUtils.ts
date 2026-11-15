import { Database } from '@/database.types';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';

type Order = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'user_id'>;
type OrderItem = Pick<
    Database['public']['Tables']['order_items']['Row'],
    'id' | 'order_id' | 'book_id' | 'quantity' | 'price'
>;
type OrderDiscount = Pick<
    Database['public']['Tables']['order_discounts']['Insert'],
    'id' | 'order_id' | 'discount_id'
>;

export const shuffle = <T>(values: readonly T[], random: () => number = Math.random): T[] => {
    const shuffled = values.slice();

    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
};

export const assertInsertedCount = <T>(
    result: SafeQueryResult<T[]>,
    expectedCount: number,
    stage: string,
): T[] => {
    if (result.error) throw new Error(`${stage} insert failed: ${result.error}`);
    if (!result.data) throw new Error(`${stage} insert returned no data.`);
    if (result.data.length !== expectedCount)
        throw new Error(
            `${stage} insert returned ${result.data.length} rows; expected ${expectedCount}.`,
        );
    return result.data;
};

export const describeError = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unknown error';

export const assertCleanupSucceeded = (
    results: Array<[string, SafeQueryResult<unknown[]>]>,
): string[] =>
    results.flatMap(([stage, result]) => (result.error ? [`${stage}: ${result.error}`] : []));

export const assertSalesBatchReferences = (
    orders: Order[],
    items: OrderItem[],
    orderDiscounts: OrderDiscount[],
    books: Array<Pick<Database['public']['Tables']['books']['Row'], 'id'>>,
    users: Array<Pick<Database['public']['Tables']['users']['Row'], 'id'>>,
    discounts: Array<Pick<Database['public']['Tables']['discounts']['Row'], 'id'>>,
): void => {
    const assertUniqueIds = (ids: string[], stage: string) => {
        if (new Set(ids).size !== ids.length) throw new Error(`${stage} contain duplicate IDs.`);
    };
    const orderIds = new Set(orders.map(({ id }) => id));
    const bookIds = new Set(books.map(({ id }) => id));
    const userIds = new Set(users.map(({ id }) => id));
    const discountIds = new Set(discounts.map(({ id }) => id));

    assertUniqueIds(
        orders.map(({ id }) => id),
        'Order batch',
    );
    assertUniqueIds(
        items.map(({ id }) => id),
        'Order-item batch',
    );
    assertUniqueIds(
        orderDiscounts.flatMap(({ id }) => (id ? [id] : [])),
        'Order-discount batch',
    );

    if (orders.some(({ user_id }) => !userIds.has(user_id)))
        throw new Error('Order batch contains a user outside the preflighted users.');

    if (
        items.some(
            ({ order_id, book_id, quantity, price }) =>
                !orderIds.has(order_id) ||
                !bookIds.has(book_id) ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0,
        )
    )
        throw new Error('Order-item batch contains an invalid order, book, quantity, or price.');

    if (
        orderDiscounts.some(
            ({ order_id, discount_id }) => !orderIds.has(order_id) || !discountIds.has(discount_id),
        )
    )
        throw new Error('Order-discount batch contains an invalid order or discount reference.');

    if (new Set(orderDiscounts.map(({ order_id }) => order_id)).size !== orderDiscounts.length)
        throw new Error('Order batch contains more than one discount for an order.');
};
