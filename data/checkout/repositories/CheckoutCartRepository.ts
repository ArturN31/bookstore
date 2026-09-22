import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

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
                id,
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
