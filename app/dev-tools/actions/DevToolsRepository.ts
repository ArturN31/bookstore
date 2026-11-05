import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchAllBooks(supabase: SupabaseClient): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('*'));
}

export async function fetchBookNaturalKeys(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ title: string; author: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('title, author'));
}

export async function fetchAllDiscounts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').select('*'));
}

export async function fetchDiscountCodes(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ code: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').select('code'));
}

export async function fetchUsersForOrders(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id'));
}

export async function insertOrders(
    supabase: SupabaseClient,
    orders: unknown[],
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('orders').insert(orders).select());
}

export async function deleteOrderDiscountsForOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_discounts').delete().in('order_id', orderIds).select('id'),
    );
}

export async function insertOrderItems(
    supabase: SupabaseClient,
    items: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('order_items').insert(items).select());
}

export async function deleteOrderItemsForOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_items').delete().in('order_id', orderIds).select('id'),
    );
}

export async function deleteOrders(
    supabase: SupabaseClient,
    orderIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('orders').delete().in('id', orderIds).select('id'),
    );
}

export async function insertOrderDiscounts(
    supabase: SupabaseClient,
    orderDiscounts: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('order_discounts').insert(orderDiscounts).select(),
    );
}

export async function insertDiscounts(
    supabase: SupabaseClient,
    discounts: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('discounts').insert(discounts).select());
}

export async function fetchBookIds(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id'));
}

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

export async function fetchBooksForReviews(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string; title: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id, title'));
}

export async function fetchUsersForReviews(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string; username: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id, username'));
}

export async function fetchReviewNaturalKeys(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ user_id: string; book_id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('book_reviews').select('user_id, book_id'));
}

export async function insertBookReviews(
    supabase: SupabaseClient,
    reviews: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('book_reviews').insert(reviews).select());
}

export async function fetchBooksForCarts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('books').select('id'));
}

export async function fetchUsersForCarts(
    supabase: SupabaseClient,
): Promise<SafeQueryResult<Array<{ id: string }>>> {
    return safeSupabaseQuery(async () => supabase.from('users').select('id'));
}

export async function insertShoppingCarts(
    supabase: SupabaseClient,
    cartsData: Array<{ user_id: string }>,
): Promise<SafeQueryResult<Array<{ id: string; user_id: string }>>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_carts').insert(cartsData).select('id, user_id'),
    );
}

export async function deleteShoppingCarts(
    supabase: SupabaseClient,
    cartIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_carts').delete().in('id', cartIds).select('id'),
    );
}

export async function insertShoppingCartItems(
    supabase: SupabaseClient,
    cartItems: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_cart_items').insert(cartItems).select(),
    );
}

export async function deleteShoppingCartItemsForCarts(
    supabase: SupabaseClient,
    cartIds: string[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () =>
        supabase.from('shopping_cart_items').delete().in('cart_id', cartIds).select('id'),
    );
}

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

export async function insertWishlistEntries(
    supabase: SupabaseClient,
    entries: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('wishlist').insert(entries).select());
}

export async function insertBooks(
    supabase: SupabaseClient,
    books: unknown[],
): Promise<SafeQueryResult<unknown[]>> {
    return safeSupabaseQuery(async () => supabase.from('books').insert(books).select());
}
