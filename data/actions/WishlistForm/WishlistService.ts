import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { addToWishlist, removeFromWishlist } from './WishlistRepository';

const WISHLIST_OPERATIONS: Record<
    string,
    (
        supabase: SupabaseClient<Database>,
        userId: string,
        bookId: string,
    ) => Promise<ActionResponse<boolean>>
> = {
    INSERT: addToWishlist,
    REMOVE: removeFromWishlist,
};

export const executeWishlistOperation = async (
    supabase: SupabaseClient<Database>,
    type: string,
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean>> => {
    const operation = WISHLIST_OPERATIONS[type];
    if (!operation) return { data: null, error: 'Unsupported wishlist action.' };

    return operation(supabase, userId, bookId);
};
