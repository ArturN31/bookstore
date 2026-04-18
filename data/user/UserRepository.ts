import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const findUserById = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('users').select('*').eq('id', userId).maybeSingle();
};

export const findWishlistByUserId = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('wishlist').select('*').eq('user_id', userId);
};

export const findFullWishlistByUserId = async (
    supabase: SupabaseClient<Database>,
    userId: string,
) => {
    return supabase
        .from('wishlist')
        .select(
            `
            *,
            bookDetails: books (*)
        `,
        )
        .eq('user_id', userId);
};
