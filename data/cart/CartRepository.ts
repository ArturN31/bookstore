import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const findCartIdByUserId = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('shopping_carts').select('id').eq('user_id', userId).maybeSingle();
};

export const createCart = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase
        .from('shopping_carts')
        .insert([{ user_id: userId }])
        .select('id')
        .single();
};

export const upsertItem = async (
    supabase: SupabaseClient<Database>,
    cartId: string,
    bookId: string,
    quantity: number,
) => {
    return supabase
        .from('shopping_cart_items')
        .upsert({ cart_id: cartId, book_id: bookId, quantity }, { onConflict: 'cart_id, book_id' });
};

export const updateItem = async (
    supabase: SupabaseClient<Database>,
    cartId: string,
    bookId: string,
    quantity: number,
) => {
    return supabase
        .from('shopping_cart_items')
        .update({ quantity })
        .match({ cart_id: cartId, book_id: bookId });
};

export const deleteItem = async (
    supabase: SupabaseClient<Database>,
    cartId: string,
    bookId: string,
) => {
    return supabase
        .from('shopping_cart_items')
        .delete()
        .match({ cart_id: cartId, book_id: bookId });
};

export const fetchFullCartWithBooks = async (
    supabase: SupabaseClient<Database>,
    userId: string,
) => {
    return supabase
        .from('shopping_carts')
        .select(
            `
            id,
            shopping_cart_items (
                quantity,
                created_at,
                books (*) 
            )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { referencedTable: 'shopping_cart_items', ascending: true })
        .maybeSingle();
};
