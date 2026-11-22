import { Json } from '@/database.types';
import type { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { SupabaseClient } from '@supabase/supabase-js';

type BookRow = Database['public']['Tables']['books']['Row'];
type DiscountRow = Database['public']['Tables']['discounts']['Row'];

/**
 * Fetches all book rows for DevTools generation.
 *
 * @param supabase Client used to query the books table.
 * @returns A safe query result containing the book rows.
 */
export async function fetchAllBooks(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<BookRow[]>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('*'));
}

/**
 * Fetches book titles and authors for natural-key collision checks.
 *
 * @param supabase Client used to query the books table.
 * @returns A safe query result containing title/author pairs.
 */
export async function fetchBookNaturalKeys(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ title: string; author: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('title, author'));
}

/**
 * Fetches all discount rows for sales planning.
 *
 * @param supabase Client used to query the discounts table.
 * @returns A safe query result containing the discount rows.
 */
export async function fetchAllDiscounts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<DiscountRow[]>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').select('*'));
}

/**
 * Fetches discount codes for duplicate-code preflight.
 *
 * @param supabase Client used to query the discounts table.
 * @returns A safe query result containing existing codes.
 */
export async function fetchDiscountCodes(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ code: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').select('code'));
}

/**
 * Fetches user IDs available for generated orders.
 *
 * @param supabase Client used to query the users table.
 * @returns A safe query result containing user IDs.
 */
export async function fetchUsersForOrders(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id'));
}

/**
 * Inserts generated orders and returns their IDs for write verification.
 *
 * @param supabase Client used to insert into the orders table.
 * @param orders Order rows to insert.
 * @returns A safe query result containing IDs of inserted orders.
 */
export async function insertOrders(
    supabase: SupabaseClient,
    orders: unknown[],
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('orders').insert(orders).select());
}

/**
 * Deletes discount assignments belonging to the specified orders.
 *
 * @param supabase Client used to delete from the order_discounts table.
 * @param orderIds Order IDs whose discount assignments should be removed.
 * @returns A safe query result containing IDs of deleted assignments.
 */
export async function deleteOrderDiscountsForOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_discounts').delete().in('order_id', orderIds).select('id'),
    );
}

/**
 * Inserts generated order items.
 *
 * @param supabase Client used to insert into the order_items table.
 * @param items Order-item rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertOrderItems(
    supabase: SupabaseClient,
    items: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('order_items').insert(items).select());
}

/**
 * Deletes order items belonging to the specified orders.
 *
 * @param supabase Client used to delete from the order_items table.
 * @param orderIds Order IDs whose items should be removed.
 * @returns A safe query result containing IDs of deleted items.
 */
export async function deleteOrderItemsForOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_items').delete().in('order_id', orderIds).select('id'),
    );
}

/**
 * Deletes the specified orders.
 *
 * @param supabase Client used to delete from the orders table.
 * @param orderIds IDs of orders to remove.
 * @returns A safe query result containing IDs of deleted orders.
 */
export async function deleteOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('orders').delete().in('id', orderIds).select('id'),
    );
}

/**
 * Inserts generated order-to-discount assignments.
 *
 * @param supabase Client used to insert into the order_discounts table.
 * @param orderDiscounts Order-discount rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertOrderDiscounts(
    supabase: SupabaseClient,
    orderDiscounts: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_discounts').insert(orderDiscounts).select(),
    );
}

/**
 * Inserts generated discounts.
 *
 * @param supabase Client used to insert into the discounts table.
 * @param discounts Discount rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertDiscounts(
    supabase: SupabaseClient,
    discounts: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').insert(discounts).select());
}

/**
 * Fetches book IDs for stock updates.
 *
 * @param supabase Client used to query the books table.
 * @returns A safe query result containing book IDs.
 */
export async function fetchBookIds(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id'));
}

/**
 * Updates stock quantities for the specified books.
 *
 * @param supabase Client used to update the books table.
 * @param targetIds Book IDs whose stock should be updated.
 * @param stockQuantity Stock quantity to set.
 * @returns A safe query result containing the updated rows.
 */
export async function updateBookStock(
    supabase: SupabaseClient,
    targetIds: string[],
    stockQuantity: number,
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase
            .from('books')
            .update({ stock_quantity: stockQuantity })
            .in('id', targetIds)
            .select(),
    );
}

/**
 * Fetches book IDs and titles for review generation.
 *
 * @param supabase Client used to query the books table.
 * @returns A safe query result containing book IDs and titles.
 */
export async function fetchBooksForReviews(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string; title: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id, title'));
}

/**
 * Fetches user IDs and usernames for review generation.
 *
 * @param supabase Client used to query the users table.
 * @returns A safe query result containing user IDs and usernames.
 */
export async function fetchUsersForReviews(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string; username: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id, username'));
}

/**
 * Fetches existing user/book pairs to prevent duplicate reviews.
 *
 * @param supabase Client used to query the book_reviews table.
 * @returns A safe query result containing existing review pairs.
 */
export async function fetchReviewNaturalKeys(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ user_id: string; book_id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('book_reviews').select('user_id, book_id'));
}

/**
 * Inserts generated book reviews.
 *
 * @param supabase Client used to insert into the book_reviews table.
 * @param reviews Review rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertBookReviews(
    supabase: SupabaseClient,
    reviews: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('book_reviews').insert(reviews).select());
}

/**
 * Fetches book IDs available for cart planning.
 *
 * @param supabase Client used to query the books table.
 * @returns A safe query result containing book IDs.
 */
export async function fetchBooksForCarts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id'));
}

/**
 * Fetches user IDs available for cart planning.
 *
 * @param supabase Client used to query the users table.
 * @returns A safe query result containing user IDs.
 */
export async function fetchUsersForCarts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id'));
}

/**
 * Inserts shopping carts and returns IDs with their owner IDs.
 *
 * @param supabase Client used to insert into the shopping_carts table.
 * @param cartsData Cart rows containing their owner user IDs.
 * @returns A safe query result containing inserted cart IDs and owner IDs.
 */
export async function insertShoppingCarts(
    supabase: SupabaseClient,
    cartsData: Array<{ user_id: string }>,
): Promise<SafeQueryResult<Array<{ id: string; user_id: string }>>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_carts').insert(cartsData).select('id, user_id'),
    );
}

/**
 * Deletes the specified shopping carts.
 *
 * @param supabase Client used to delete from the shopping_carts table.
 * @param cartIds IDs of carts to remove.
 * @returns A safe query result containing IDs of deleted carts.
 */
export async function deleteShoppingCarts(
    supabase: SupabaseClient,
    cartIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_carts').delete().in('id', cartIds).select('id'),
    );
}

/**
 * Inserts items for generated shopping carts.
 *
 * @param supabase Client used to insert into the shopping_cart_items table.
 * @param cartItems Cart-item rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertShoppingCartItems(
    supabase: SupabaseClient,
    cartItems: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_cart_items').insert(cartItems).select(),
    );
}

/**
 * Deletes items belonging to the specified shopping carts.
 *
 * @param supabase Client used to delete from the shopping_cart_items table.
 * @param cartIds Cart IDs whose items should be removed.
 * @returns A safe query result containing IDs of deleted items.
 */
export async function deleteShoppingCartItemsForCarts(
    supabase: SupabaseClient,
    cartIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_cart_items').delete().in('cart_id', cartIds).select('id'),
    );
}

/**
 * Loads books, users, and existing wishlist pairs for candidate planning.
 *
 * @param supabase Client used to query the books, users, and wishlist tables.
 * @returns Safe query results in the order books, users, and existing wishlist pairs.
 */
export async function fetchWishlistContext(
    supabase: SupabaseClient,
): Promise<
    [
        SafeQueryResult<Array<{ id: string }>>,
        SafeQueryResult<Array<{ id: string }>>,
        SafeQueryResult<Array<{ user_id: string; book_id: string }>>,
    ]
> {
    return Promise.all([
        safeSupabaseQuery(async () => supabase.from('books').select('id')),
        safeSupabaseQuery(async () => supabase.from('users').select('id')),
        safeSupabaseQuery(async () => supabase.from('wishlist').select('user_id, book_id')),
    ]);
}

/**
 * Inserts planned wishlist entries.
 *
 * @param supabase Client used to insert into the wishlist table.
 * @param entries Wishlist rows to insert.
 * @returns A safe query result containing the inserted rows.
 */
export async function insertWishlistEntries(
    supabase: SupabaseClient,
    entries: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('wishlist').insert(entries).select());
}

/**
 * Inserts books through the transaction-scoped DevTools natural-key guard.
 *
 * @param supabase Client used to call the insert_dev_tool_books RPC.
 * @param books Book rows to insert.
 * @returns A safe query result containing the RPC result rows.
 */
export async function insertBooks(
    supabase: SupabaseClient,
    books: Json[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.rpc('insert_dev_tool_books', { p_books: books }),
    );
}
