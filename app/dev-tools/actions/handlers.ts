import { SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/en_GB';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';

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

export const handleAddSales: CommandHandler = async (supabase) => {
    const [booksRes, discountsRes] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('discounts').select('*'),
    ]);

    if (booksRes.error) throw booksRes.error;
    if (discountsRes.error) throw discountsRes.error;

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

    const { error: ordErr } = await supabase.from('orders').insert(orders);
    if (ordErr) throw ordErr;

    const tasks = [supabase.from('order_items').insert(items)];

    if (orderDiscounts.length > 0)
        tasks.push(supabase.from('order_discounts').insert(orderDiscounts));

    const results = await Promise.all(tasks);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;

    return {
        message: `Success: ${DEV_CONFIG.ORDERS_COUNT} Orders injected.`,
        success: true,
    };
};

export const handleSeedDiscounts: CommandHandler = async (supabase) => {
    const discounts = generateDiscounts(DEV_CONFIG.DISCOUNT_COUNT);

    const { error } = await supabase.from('discounts').insert(discounts);
    if (error) throw error;

    return { message: `${DEV_CONFIG.DISCOUNT_COUNT} New Discounts Added`, success: true };
};

export const handleStockPurge: CommandHandler = async (supabase) => {
    const { data: books, error: fetchErr } = await supabase.from('books').select('id');
    if (fetchErr || !books?.length) throw new Error('Inventory lookup failed.');

    const targetIds = books
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(books.length * DEV_CONFIG.STOCK_PURGE_RATIO))
        .map((b) => b.id);

    const { error } = await supabase
        .from('books')
        .update({ stock_quantity: 0 })
        .in('id', targetIds);

    if (error) throw error;

    return { message: `Chaos: ${targetIds.length} books set to 0 stock.`, success: true };
};

export const handleReviewBomb: CommandHandler = async (supabase) => {
    const [{ data: books }, { data: users }] = await Promise.all([
        supabase.from('books').select('id, title'),
        supabase.from('users').select('id, username'),
    ]);

    if (!books || !users || books.length === 0 || users.length === 0)
        throw new Error('Seed Error: Required data for reviews is missing.');

    const reviews = generateReviewsArray(
        books as BookDB[],
        DEV_CONFIG.REVIEW_COUNT,
        users as UserDB[],
    );

    const { error } = await supabase.from('book_reviews').insert(reviews);
    if (error) throw error;

    return {
        message: `Social Proof: ${reviews.length} reviews distributed among ${users.length} profiles.`,
        success: true,
    };
};

export const handleAddCarts: CommandHandler = async (supabase) => {
    const [{ data: books }, { data: users }] = await Promise.all([
        supabase.from('books').select('id'),
        supabase.from('users').select('id'),
    ]);

    if (!books?.length || !users?.length) throw new Error('Data missing for carts.');

    const targetUsers = users.sort(() => 0.5 - Math.random()).slice(0, DEV_CONFIG.USER_COUNT);

    const { data: carts, error: cartErr } = await supabase
        .from('shopping_carts')
        .insert(targetUsers.map((u) => ({ user_id: u.id })))
        .select('id, user_id');

    if (cartErr || !carts) throw cartErr;

    const cartItems = carts.flatMap((cart) => {
        const selectedBooks = books
            .sort(() => 0.5 - Math.random())
            .slice(0, faker.number.int({ min: 1, max: 3 }));

        return selectedBooks.map((book) => ({
            cart_id: cart.id,
            book_id: book.id,
            quantity: faker.number.int({ min: 1, max: 2 }),
        }));
    });

    const { error: itemErr } = await supabase.from('shopping_cart_items').insert(cartItems);
    if (itemErr) throw itemErr;

    return { message: `Cart Injection: ${carts.length} carts populated.`, success: true };
};

export const handleAddWishlists: CommandHandler = async (supabase) => {
    const [{ data: books }, { data: users }, { data: existing }] = await Promise.all([
        supabase.from('books').select('id'),
        supabase.from('users').select('id'),
        supabase.from('wishlist').select('user_id, book_id'),
    ]);

    if (!books?.length || !users?.length) throw new Error('Missing data.');

    const existingSet = new Set(existing?.map((e) => `${e.user_id}-${e.book_id}`));
    const allPossible = users.flatMap((u) => books.map((b) => ({ user_id: u.id, book_id: b.id })));

    const newEntries = allPossible
        .filter((pair) => !existingSet.has(`${pair.user_id}-${pair.book_id}`))
        .sort(() => 0.5 - Math.random())
        .slice(0, DEV_CONFIG.WISHLIST_COUNT);

    if (newEntries.length === 0) throw new Error('No more unique combinations available.');

    const { error } = await supabase.from('wishlist').insert(newEntries);
    if (error) throw error;

    return { message: `Success: Added ${newEntries.length} wishlist items.`, success: true };
};

export const handleAddBooks: CommandHandler = async (supabase: SupabaseClient) => {
    const books = generateBooksArray(50);

    const { error } = await supabase.from('books').insert(books);
    if (error) throw error;

    return { message: `Success: ${books.length} books inserted.`, success: true };
};
