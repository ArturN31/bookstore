import { SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/en_GB';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
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

export interface BookDB {
    id: string;
    title: string;
    author: string;
    genre: string;
    publisher: string;
    format: string;
    price: string;
    stock: number;
    stock_quantity: number;
    sales_count: number;
    description: string;
    page_count: number;
    image_url: string;
    publication_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DiscountDB {
    id: string;
    code: string;
    value: number;
    type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserDB {
    id: string;
    username: string;
    email?: string;
    created_at?: string;
    updated_at?: string;
}

export type CommandResponse = { message: string; success: boolean };
export type CommandHandler = (supabase: SupabaseClient) => Promise<CommandResponse>;

export const addSales: CommandHandler = async (supabase) => {
    const [booksRes, discountsRes] = await Promise.all([
        repository.fetchAllBooks(supabase),
        repository.fetchAllDiscounts(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (discountsRes.error) throw new Error(discountsRes.error);

    const books = booksRes.data as BookDB[];
    const discounts = (discountsRes.data as DiscountDB[]) || [];

    if (!books || books.length === 0) throw new Error('Seed Failure: Catalog is empty.');

    const { orders, items, orderDiscounts } = generateOrdersAndItems(
        books,
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
    const discounts = generateDiscounts(DEV_CONFIG.DISCOUNT_COUNT);

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
    const [booksRes, usersRes] = await Promise.all([
        repository.fetchBooksForReviews(supabase),
        repository.fetchUsersForReviews(supabase),
    ]);

    if (booksRes.error) throw new Error(booksRes.error);
    if (usersRes.error) throw new Error(usersRes.error);

    const books = booksRes.data;
    const users = usersRes.data;

    if (!books || !users || books.length === 0 || users.length === 0)
        throw new Error('Seed Error: Required data for reviews is missing.');

    const reviews = generateReviewsArray(
        books as BookDB[],
        DEV_CONFIG.REVIEW_COUNT,
        users as UserDB[],
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

    if (!books?.length || !users?.length) throw new Error('Missing data.');

    const existingSet = new Set(
        existing?.map((e: { user_id: string; book_id: string }) => `${e.user_id}-${e.book_id}`),
    );
    const allPossible = users.flatMap((u: { id: string }) =>
        books.map((b: { id: string }) => ({ user_id: u.id, book_id: b.id })),
    );

    const newEntries = allPossible
        .filter(
            (pair: { user_id: string; book_id: string }) =>
                !existingSet.has(`${pair.user_id}-${pair.book_id}`),
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, DEV_CONFIG.WISHLIST_COUNT);

    if (newEntries.length === 0) throw new Error('No more unique combinations available.');

    const res = await repository.insertWishlistEntries(supabase, newEntries);
    if (res.error) throw new Error(res.error);

    return { message: `Success: Added ${newEntries.length} wishlist items.`, success: true };
};

export const addBooks: CommandHandler = async (supabase: SupabaseClient) => {
    const books = generateBooksArray(50);

    const res = await repository.insertBooks(supabase, books);
    if (res.error) throw new Error(res.error);

    return { message: `Success: ${books.length} books inserted.`, success: true };
};
