import { SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/en_GB';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import {
    naturalPairKey,
    normalizeNaturalKey,
    planUniqueCandidates,
} from '@/utils/db/dbSeed/candidatePlanning';
import * as repository from './DevToolsRepository';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';

const DEV_CONFIG = {
    BOOK_COUNT: 50,
    REVIEW_COUNT: 50,
    USER_COUNT: 15,
    CART_ITEM_COUNT: 10,
    ORDERS_COUNT: 10,
    ORDER_ITEM_COUNT: 10,
    ORDER_DISCOUNT_COUNT: 10,
    DISCOUNT_COUNT: 5,
    WISHLIST_COUNT: 10,
    STOCK_PURGE_RATIO: 0.5,
} as const;

export type CommandResponse = { message: string; success: boolean };
export type CommandHandler = (supabase: SupabaseClient) => Promise<CommandResponse>;

export const addSales: CommandHandler = async (supabase) => {
    const [booksRes, discountsRes, usersRes] = await Promise.all([
        repository.fetchAllBooks(supabase),
        repository.fetchAllDiscounts(supabase),
        repository.fetchUsersForOrders(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (discountsRes.error) throw new Error(discountsRes.error);
    if (usersRes.error) throw new Error(usersRes.error);

    const books = booksRes.data as BookDB[];
    const discounts = (discountsRes.data as DiscountDB[]) || [];
    const users = usersRes.data;

    if (!books || books.length === 0) throw new Error('Seed Failure: Catalog is empty.');
    if (!users) throw new Error('Seed Failure: User lookup returned no data.');
    if (users.length === 0) throw new Error('Seed Failure: No users are available for orders.');

    const { orders, items, orderDiscounts } = generateOrdersAndItems(
        books,
        users,
        DEV_CONFIG.ORDERS_COUNT,
        DEV_CONFIG.ORDER_ITEM_COUNT,
        discounts,
        DEV_CONFIG.DISCOUNT_COUNT,
    );

    const ordRes = await repository.insertOrders(supabase, orders);
    if (ordRes.error) throw new Error(ordRes.error);

    const tasks = [repository.insertOrderItems(supabase, items)];

    if (orderDiscounts.length > 0)
        tasks.push(repository.insertOrderDiscounts(supabase, orderDiscounts));

    const results = await Promise.all(tasks);
    const failed = results.find((r: SafeQueryResult<unknown>) => r.error);
    if (failed?.error) throw new Error(failed.error);

    return {
        message: `Success: ${DEV_CONFIG.ORDERS_COUNT} Orders injected.`,
        success: true,
    };
};

export const seedDiscounts: CommandHandler = async (supabase) => {
    const existingRes = await repository.fetchDiscountCodes(supabase);
    if (existingRes.error) throw new Error(existingRes.error);
    if (!existingRes.data) throw new Error('Discount code lookup returned no data.');

    const existingKeys = existingRes.data.map(({ code }) => normalizeNaturalKey(code));
    const discounts = generateDiscounts(DEV_CONFIG.DISCOUNT_COUNT, existingKeys);

    const res = await repository.insertDiscounts(supabase, discounts);
    if (res.error) throw new Error(res.error);

    return { message: `${DEV_CONFIG.DISCOUNT_COUNT} New Discounts Added`, success: true };
};

export const stockPurge: CommandHandler = async (supabase) => {
    const { data: books, error: fetchErr } = await repository.fetchBookIds(supabase);
    if (fetchErr || !books?.length) throw new Error('Inventory lookup failed.');

    const targetIds = books
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(books.length * DEV_CONFIG.STOCK_PURGE_RATIO))
        .map((b: { id: string }) => b.id);

    const res = await repository.updateBookStock(supabase, targetIds, 0);
    if (res.error) throw new Error(res.error);

    return { message: `Chaos: ${targetIds.length} books set to 0 stock.`, success: true };
};

export const reviewBomb: CommandHandler = async (supabase) => {
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
        books as BookDB[],
        DEV_CONFIG.REVIEW_COUNT,
        users as UserDB[],
        existingReviewsRes.data.map(({ user_id, book_id }) =>
            naturalPairKey(user_id, book_id),
        ),
    );

    const res = await repository.insertBookReviews(supabase, reviews);
    if (res.error) throw new Error(res.error);

    return {
        message: `Social Proof: ${reviews.length} reviews distributed among ${users.length} profiles.`,
        success: true,
    };
};

export const addCarts: CommandHandler = async (supabase) => {
    const [booksRes, usersRes] = await Promise.all([
        repository.fetchBooksForCarts(supabase),
        repository.fetchUsersForCarts(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);

    const books = booksRes.data;
    const users = usersRes.data;

    if (!books?.length || !users?.length) throw new Error('Data missing for carts.');

    const targetUsers = users.sort(() => 0.5 - Math.random()).slice(0, DEV_CONFIG.USER_COUNT);

    const { data: carts, error: cartErr } = await repository.insertShoppingCarts(
        supabase,
        targetUsers.map((u: { id: string }) => ({ user_id: u.id })),
    );

    if (cartErr || !carts) throw new Error(cartErr || 'Cart insert error');

    const cartItems = carts.flatMap((cart: { id: string }) => {
        const selectedBooks = books
            .sort(() => 0.5 - Math.random())
            .slice(0, faker.number.int({ min: 1, max: 3 }));

        return selectedBooks.map((book: { id: string }) => ({
            cart_id: cart.id,
            book_id: book.id,
            quantity: faker.number.int({ min: 1, max: 2 }),
        }));
    });

    const itemRes = await repository.insertShoppingCartItems(supabase, cartItems);
    if (itemRes.error) throw new Error(itemRes.error);

    return { message: `Cart Injection: ${carts.length} carts populated.`, success: true };
};

export const addWishlists: CommandHandler = async (supabase) => {
    const [booksRes, usersRes, existingRes] = await repository.fetchWishlistContext(supabase);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);
    if (existingRes.error) throw new Error(existingRes.error);

    const books = booksRes.data;
    const users = usersRes.data;
    const existing = existingRes.data;

    if (!books?.length || !users?.length || !existing) throw new Error('Missing data.');

    const existingKeys = existing.map(({ user_id, book_id }) =>
        naturalPairKey(user_id, book_id),
    );
    const allPossible = users.flatMap((u: { id: string }) =>
        books.map((b: { id: string }) => ({ user_id: u.id, book_id: b.id })),
    );

    const newEntries = planUniqueCandidates(
        allPossible.sort(() => 0.5 - Math.random()),
        DEV_CONFIG.WISHLIST_COUNT,
        ({ user_id, book_id }) => [naturalPairKey(user_id, book_id)],
        existingKeys,
    );

    const res = await repository.insertWishlistEntries(supabase, newEntries);
    if (res.error) throw new Error(res.error);

    return { message: `Success: Added ${newEntries.length} wishlist items.`, success: true };
};

export const addBooks: CommandHandler = async (supabase: SupabaseClient) => {
    const existingRes = await repository.fetchBookNaturalKeys(supabase);
    if (existingRes.error) throw new Error(existingRes.error);
    if (!existingRes.data) throw new Error('Book key lookup returned no data.');

    const existingKeys = existingRes.data.map(({ title, author }) =>
        naturalPairKey(title, author),
    );
    const books = generateBooksArray(DEV_CONFIG.BOOK_COUNT, existingKeys);

    const res = await repository.insertBooks(supabase, books);
    if (res.error) throw new Error(res.error);

    return { message: `Success: ${books.length} books inserted.`, success: true };
};
