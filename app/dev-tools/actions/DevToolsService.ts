import { SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/en_GB';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import {
    naturalPairKey,
    normalizeNaturalKey,
} from '@/utils/db/dbSeed/candidatePlanning';
import * as repository from './DevToolsRepository';
import {
    assertCleanupSucceeded,
    assertInsertedCount,
    assertSalesBatchReferences,
    describeError,
    planWishlistEntries,
    shuffle,
} from './DevToolsServiceUtils';

const DEV_CONFIG = {
    BOOK_COUNT: 50,
    REVIEW_COUNT: 50,
    USER_COUNT: 15,
    ORDERS_COUNT: 10,
    ORDER_ITEM_COUNT: 10,
    DISCOUNT_COUNT: 5,
    WISHLIST_COUNT: 10,
    STOCK_PURGE_RATIO: 0.5,
} as const;

export type CommandResponse = { message: string; success: boolean };
export type AuthorizeWrite = () => Promise<void>;
export type CommandHandler = (
    supabase: SupabaseClient,
    authorizeWrite: AuthorizeWrite,
) => Promise<CommandResponse>;

type SalesContext = {
    books: BookDB[];
    discounts: DiscountDB[];
    users: Array<{ id: string }>;
};

type SalesBatch = ReturnType<typeof generateOrdersAndItems>;

const fetchSalesContext = async (supabase: SupabaseClient): Promise<SalesContext> => {
    const [booksRes, discountsRes, usersRes] = await Promise.all([
        repository.fetchAllBooks(supabase),
        repository.fetchAllDiscounts(supabase),
        repository.fetchUsersForOrders(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (discountsRes.error) throw new Error(discountsRes.error);
    if (usersRes.error) throw new Error(usersRes.error);

    const books = booksRes.data;
    const discounts = discountsRes.data ?? [];
    const users = usersRes.data;

    if (!books || books.length === 0) throw new Error('Seed Failure: Catalog is empty.');
    if (!users) throw new Error('Seed Failure: User lookup returned no data.');
    if (users.length === 0) throw new Error('Seed Failure: No users are available for orders.');

    return { books, discounts, users };
};

const planSalesBatch = ({ books, discounts, users }: SalesContext): SalesBatch => {
    const batch = generateOrdersAndItems(
        books,
        users,
        DEV_CONFIG.ORDERS_COUNT,
        DEV_CONFIG.ORDER_ITEM_COUNT,
        discounts,
        DEV_CONFIG.DISCOUNT_COUNT,
    );

    if (batch.orders.length !== DEV_CONFIG.ORDERS_COUNT)
        throw new Error(
            `Order planning returned ${batch.orders.length} of ${DEV_CONFIG.ORDERS_COUNT} orders.`,
        );
    if (batch.items.length !== DEV_CONFIG.ORDER_ITEM_COUNT)
        throw new Error(
            `Order-item planning returned ${batch.items.length} of ${DEV_CONFIG.ORDER_ITEM_COUNT} items.`,
        );
    assertSalesBatchReferences(
        batch.orders,
        batch.items,
        batch.orderDiscounts,
        books,
        users,
        discounts,
    );

    return batch;
};

const insertSalesBatch = async (supabase: SupabaseClient, batch: SalesBatch): Promise<void> => {
    const { orders, items, orderDiscounts } = batch;
    const orderIds = orders.map(({ id }) => id);
    const orderResult = await repository.insertOrders(supabase, orders);
    if (orderResult.error)
        throw new Error(
            `Order insert failed before inserted IDs were confirmed: ${orderResult.error}. Verify whether orders were committed before retrying.`,
        );
    if (!orderResult.data)
        throw new Error(
            'Order insert returned no data; verify whether orders were committed before retrying.',
        );

    const insertedOrderIds = orderResult.data.map(({ id }) => id);
    if (
        insertedOrderIds.length !== orders.length ||
        orderIds.some((id) => !insertedOrderIds.includes(id))
    ) {
        const orderCleanup = await repository.deleteOrders(supabase, insertedOrderIds);
        const cleanupStatus = orderCleanup.error
            ? ` Cleanup failed: ${orderCleanup.error}; verify orders before retrying.`
            : ' Confirmed inserted orders were removed; verify for any unconfirmed records before retrying.';
        throw new Error(
            `Order insert returned ${insertedOrderIds.length} of ${orders.length} expected IDs.${cleanupStatus}`,
        );
    }

    const completedStages: string[] = [];

    try {
        completedStages.push('orders');

        const itemResult = await repository.insertOrderItems(supabase, items);
        assertInsertedCount(itemResult, items.length, 'Order items');
        completedStages.push('order items');

        if (orderDiscounts.length > 0) {
            const discountResult = await repository.insertOrderDiscounts(supabase, orderDiscounts);
            assertInsertedCount(discountResult, orderDiscounts.length, 'Order discounts');
            completedStages.push('order discounts');
        }
    } catch (error: unknown) {
        const orderDiscountCleanup = await repository.deleteOrderDiscountsForOrders(
            supabase,
            insertedOrderIds,
        );
        const itemCleanup = await repository.deleteOrderItemsForOrders(supabase, insertedOrderIds);
        const orderCleanup = await repository.deleteOrders(supabase, insertedOrderIds);
        const cleanupErrors = assertCleanupSucceeded([
            ['order-discount cleanup', orderDiscountCleanup],
            ['order-item cleanup', itemCleanup],
            ['order cleanup', orderCleanup],
        ]);
        const previousStages = completedStages.length
            ? ` Completed stages: ${completedStages.join(', ')}.`
            : '';
        const cleanupStatus = cleanupErrors.length
            ? ` Cleanup was incomplete (${cleanupErrors.join('; ')}); verify these records before retrying.`
            : ' Generated order records were rolled back.';

        throw new Error(
            `Order generation failed: ${describeError(error)}.${previousStages}${cleanupStatus}`,
        );
    }
};

export const addSales: CommandHandler = async (supabase, authorizeWrite) => {
    const context = await fetchSalesContext(supabase);
    const batch = planSalesBatch(context);

    await authorizeWrite();
    await insertSalesBatch(supabase, batch);

    return {
        message: `Success: ${DEV_CONFIG.ORDERS_COUNT} Orders injected.`,
        success: true,
    };
};

export const seedDiscounts: CommandHandler = async (supabase, authorizeWrite) => {
    const existingRes = await repository.fetchDiscountCodes(supabase);
    if (existingRes.error) throw new Error(existingRes.error);
    if (!existingRes.data) throw new Error('Discount code lookup returned no data.');

    const existingKeys = existingRes.data.map(({ code }) => normalizeNaturalKey(code));
    const discounts = generateDiscounts(DEV_CONFIG.DISCOUNT_COUNT, existingKeys);

    await authorizeWrite();
    const res = await repository.insertDiscounts(supabase, discounts);
    const insertedDiscounts = assertInsertedCount(res, discounts.length, 'Discount');

    return { message: `${insertedDiscounts.length} New Discounts Added`, success: true };
};

export const stockPurge: CommandHandler = async (supabase, authorizeWrite) => {
    const { data: books, error: fetchErr } = await repository.fetchBookIds(supabase);
    if (fetchErr) throw new Error(fetchErr);
    if (!books?.length) throw new Error('Inventory lookup returned no books.');

    const targetIds = shuffle(books)
        .slice(0, Math.max(1, Math.floor(books.length * DEV_CONFIG.STOCK_PURGE_RATIO)))
        .map((b: { id: string }) => b.id);

    await authorizeWrite();
    const res = await repository.updateBookStock(supabase, targetIds, 0);
    if (res.error) throw new Error(res.error);
    if (!res.data) throw new Error('Stock purge returned no updated rows.');
    if (res.data.length !== targetIds.length)
        throw new Error(
            `Stock purge updated ${res.data.length} books; expected ${targetIds.length}.`,
        );

    return { message: `Chaos: ${targetIds.length} books set to 0 stock.`, success: true };
};

export const reviewBomb: CommandHandler = async (supabase, authorizeWrite) => {
    const [booksRes, usersRes, existingReviewsRes] = await Promise.all([
        repository.fetchBooksForReviews(supabase),
        repository.fetchUsersForReviews(supabase),
        repository.fetchReviewNaturalKeys(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);
    if (existingReviewsRes.error) throw new Error(existingReviewsRes.error);
    if (!existingReviewsRes.data) throw new Error('Review key lookup returned no data.');

    const books = booksRes.data;
    const users = usersRes.data;

    if (!books || !users || books.length === 0 || users.length === 0)
        throw new Error('Seed Error: Required data for reviews is missing.');

    const reviews = generateReviewsArray(
        books,
        DEV_CONFIG.REVIEW_COUNT,
        users,
        existingReviewsRes.data.map(({ user_id, book_id }) => naturalPairKey(user_id, book_id)),
    );

    await authorizeWrite();
    const res = await repository.insertBookReviews(supabase, reviews);
    const insertedReviews = assertInsertedCount(res, reviews.length, 'Review');

    return {
        message: `Social Proof: ${insertedReviews.length} reviews distributed among ${users.length} profiles.`,
        success: true,
    };
};

type PlannedCart = {
    userId: string;
    books: Array<{ bookId: string; quantity: number }>;
};

const planCartItems = (
    targetUsers: Array<{ id: string }>,
    books: Array<{ id: string }>,
): PlannedCart[] =>
    targetUsers.map((user) => {
        const itemCount = faker.number.int({
            min: 1,
            max: Math.min(3, books.length),
        });
        const selectedBooks = shuffle(books).slice(0, itemCount);
        return {
            userId: user.id,
            books: selectedBooks.map((book) => ({
                bookId: book.id,
                quantity: faker.number.int({ min: 1, max: 2 }),
            })),
        };
    });

const createCartItemRows = (carts: Array<{ id: string; user_id: string }>, plan: PlannedCart[]) => {
    const itemsByUser = new Map(plan.map(({ userId, books: items }) => [userId, items]));

    return carts.flatMap((cart) => {
        const userItems = itemsByUser.get(cart.user_id);
        if (!userItems)
            throw new Error(`Inserted cart ${cart.id} does not match the preflighted users.`);

        return userItems.map(({ bookId, quantity }) => ({
            cart_id: cart.id,
            book_id: bookId,
            quantity,
        }));
    });
};

const cleanupCartBatch = async (
    supabase: SupabaseClient,
    cartIds: string[],
): Promise<string[]> => {
    const itemCleanup = await repository.deleteShoppingCartItemsForCarts(supabase, cartIds);
    const cartCleanup = await repository.deleteShoppingCarts(supabase, cartIds);

    return assertCleanupSucceeded([
        ['cart-item cleanup', itemCleanup],
        ['cart cleanup', cartCleanup],
    ]);
};

const insertCartBatch = async (
    supabase: SupabaseClient,
    targetUsers: Array<{ id: string }>,
    plannedItems: PlannedCart[],
): Promise<Array<{ id: string; user_id: string }>> => {
    const { data: carts, error: cartErr } = await repository.insertShoppingCarts(
        supabase,
        targetUsers.map(({ id }) => ({ user_id: id })),
    );

    if (cartErr || !carts) {
        throw new Error(
            `Cart insert failed: ${cartErr || 'Cart insert error'}; no cart IDs were confirmed, so verify whether records were committed before retrying.`,
        );
    }

    const insertedUserIds = carts.map(({ user_id }) => user_id);
    if (
        carts.length !== targetUsers.length ||
        new Set(insertedUserIds).size !== targetUsers.length ||
        targetUsers.some(({ id }) => !insertedUserIds.includes(id))
    ) {
        const confirmedCartIds = carts.map(({ id }) => id);
        const rollbackErrors = await cleanupCartBatch(supabase, confirmedCartIds);
        const rollbackError = rollbackErrors.length
            ? ` Cleanup was incomplete (${rollbackErrors.join('; ')}); verify these records before retrying.`
            : ' Inserted carts were rolled back.';
        throw new Error(
            `Cart insert returned ${carts.length} rows that did not match the ${targetUsers.length} planned users.${rollbackError} Verify for unconfirmed records before retrying.`,
        );
    }

    try {
        const cartItems = createCartItemRows(carts, plannedItems);
        const itemRes = await repository.insertShoppingCartItems(supabase, cartItems);
        assertInsertedCount(itemRes, cartItems.length, 'Cart item');
    } catch (error: unknown) {
        const cartIds = carts.map(({ id }) => id);
        const cleanupErrors = await cleanupCartBatch(supabase, cartIds);
        const cleanupStatus = cleanupErrors.length
            ? ` Cleanup was incomplete (${cleanupErrors.join('; ')}); verify these records before retrying.`
            : ' Generated carts were rolled back.';
        throw new Error(`Cart generation failed: ${describeError(error)}.${cleanupStatus}`);
    }

    return carts;
};

export const addCarts: CommandHandler = async (supabase, authorizeWrite) => {
    const [booksRes, usersRes] = await Promise.all([
        repository.fetchBooksForCarts(supabase),
        repository.fetchUsersForCarts(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);

    const books = booksRes.data;
    const users = usersRes.data;

    if (!books?.length || !users?.length) throw new Error('Data missing for carts.');

    if (users.length < DEV_CONFIG.USER_COUNT)
        throw new Error(
            `Cart planning requires ${DEV_CONFIG.USER_COUNT} users; only ${users.length} are available.`,
        );

    const targetUsers = shuffle(users).slice(0, DEV_CONFIG.USER_COUNT);
    const plannedItems = planCartItems(targetUsers, books);

    await authorizeWrite();
    const carts = await insertCartBatch(supabase, targetUsers, plannedItems);

    return { message: `Cart Injection: ${carts.length} carts populated.`, success: true };
};

export const addWishlists: CommandHandler = async (supabase, authorizeWrite) => {
    const [booksRes, usersRes, existingRes] = await repository.fetchWishlistContext(supabase);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);
    if (existingRes.error) throw new Error(existingRes.error);

    const books = booksRes.data;
    const users = usersRes.data;
    const existing = existingRes.data;

    if (!books?.length || !users?.length || !existing) throw new Error('Missing data.');

    const newEntries = planWishlistEntries(
        users,
        books,
        existing,
        DEV_CONFIG.WISHLIST_COUNT,
    );

    await authorizeWrite();
    const res = await repository.insertWishlistEntries(supabase, newEntries);
    const insertedEntries = assertInsertedCount(res, newEntries.length, 'Wishlist');

    return { message: `Success: Added ${insertedEntries.length} wishlist items.`, success: true };
};

export const addBooks: CommandHandler = async (supabase: SupabaseClient, authorizeWrite) => {
    const existingRes = await repository.fetchBookNaturalKeys(supabase);
    if (existingRes.error) throw new Error(existingRes.error);
    if (!existingRes.data) throw new Error('Book key lookup returned no data.');

    const existingKeys = existingRes.data.map(({ title, author }) => naturalPairKey(title, author));
    const books = generateBooksArray(DEV_CONFIG.BOOK_COUNT, existingKeys);

    await authorizeWrite();
    const res = await repository.insertBooks(supabase, books);
    const insertedBooks = assertInsertedCount(res, books.length, 'Book');

    return { message: `Success: ${insertedBooks.length} books inserted.`, success: true };
};
