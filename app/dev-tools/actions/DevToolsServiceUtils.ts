import type { Database } from '@/database.types';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import {
    assertCandidateCapacity,
    assertValidRequestedCount,
    normalizeNaturalKey,
} from '@/utils/db/dbSeed/candidatePlanning';

type Order = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'user_id'>;
type OrderItem = Pick<
    Database['public']['Tables']['order_items']['Row'],
    'id' | 'order_id' | 'book_id' | 'quantity' | 'price'
>;
type OrderDiscount = Pick<
    Database['public']['Tables']['order_discounts']['Insert'],
    'id' | 'order_id' | 'discount_id'
>;
type WishlistEntry = { user_id: string; book_id: string };

const uniqueIds = (ids: readonly string[]): string[] => [
    ...new Map(ids.map((id) => [normalizeNaturalKey(id), id])).values(),
];

const sampleIndexes = (
    rangeSize: number,
    sampleSize: number,
    random: () => number,
): number[] => {
    const selected = new Set<number>();

    for (let index = rangeSize - sampleSize; index < rangeSize; index++) {
        const randomValue = random();
        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1)
            throw new RangeError('Random source must return a value in the range [0, 1).');

        const candidate = Math.floor(randomValue * (index + 1));
        selected.add(selected.has(candidate) ? index : candidate);
    }

    return [...selected];
};

const findAvailableIndex = (availableIndex: number, occupiedIndexes: number[]): number => {
    let low = availableIndex;
    let high = availableIndex + occupiedIndexes.length;

    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        let left = 0;
        let right = occupiedIndexes.length;

        while (left < right) {
            const searchMiddle = Math.floor((left + right) / 2);
            if (occupiedIndexes[searchMiddle] <= middle) left = searchMiddle + 1;
            else right = searchMiddle;
        }

        const availableThroughMiddle = middle + 1 - left;
        if (availableThroughMiddle > availableIndex) high = middle;
        else low = middle + 1;
    }

    return low;
};

export const planWishlistEntries = (
    users: readonly Pick<Database['public']['Tables']['users']['Row'], 'id'>[],
    books: readonly Pick<Database['public']['Tables']['books']['Row'], 'id'>[],
    existingEntries: readonly WishlistEntry[],
    requestedCount: number,
    random: () => number = Math.random,
): WishlistEntry[] => {
    assertValidRequestedCount(requestedCount);
    if (requestedCount === 0) return [];

    const userIds = uniqueIds(users.map(({ id }) => id));
    const bookIds = uniqueIds(books.map(({ id }) => id));
    if (userIds.some((id) => !id.trim()) || bookIds.some((id) => !id.trim()))
        throw new Error('Wishlist planning requires non-empty user and book IDs.');

    const totalPairs = userIds.length * bookIds.length;
    if (!Number.isSafeInteger(totalPairs))
        throw new RangeError('Wishlist candidate space exceeds the safe integer range.');

    const userIndexes = new Map(
        userIds.map((id, index) => [normalizeNaturalKey(id), index]),
    );
    const bookIndexes = new Map(
        bookIds.map((id, index) => [normalizeNaturalKey(id), index]),
    );
    const occupiedIndexes = new Set<number>();

    existingEntries.forEach(({ user_id, book_id }) => {
        const userIndex = userIndexes.get(normalizeNaturalKey(user_id));
        const bookIndex = bookIndexes.get(normalizeNaturalKey(book_id));
        if (userIndex !== undefined && bookIndex !== undefined)
            occupiedIndexes.add(userIndex * bookIds.length + bookIndex);
    });

    const availableCount = totalPairs - occupiedIndexes.size;
    assertCandidateCapacity(requestedCount, availableCount);

    const occupied = [...occupiedIndexes].sort((a, b) => a - b);
    const selectedIndexes = sampleIndexes(availableCount, requestedCount, random).map((index) =>
        findAvailableIndex(index, occupied),
    );

    return selectedIndexes.map((index) => {
        const userId = userIds[Math.floor(index / bookIds.length)];
        const bookId = bookIds[index % bookIds.length];
        if (!userId || !bookId) throw new Error('Wishlist sampling produced an invalid pair.');

        return { user_id: userId, book_id: bookId };
    });
};

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
