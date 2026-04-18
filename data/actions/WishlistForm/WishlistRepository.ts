import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const addToWishlist = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean>> => {
    const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: userId, book_id: bookId }]);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
};

export const removeFromWishlist = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean>> => {
    const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
};
