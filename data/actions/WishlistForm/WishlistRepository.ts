import { createBackendClient } from '@/utils/db/server';
import { withRetry } from '@/utils/network/retry';
import { PostgrestError } from '@supabase/supabase-js';

const handleDatabaseError = (error: PostgrestError, context: string): ActionResponse<never> => {
    console.error(`[CartService] ${context} failure:`, error.message);
    return {
        data: null,
        error: `Unable to ${context.toLowerCase()} at this time.`,
    };
};

export const addToWishlist = async (
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean>> => {
    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();
            return await supabase.from('wishlist').insert([{ user_id: userId, book_id: bookId }]);
        });

        if (result.error) return handleDatabaseError(result.error, 'Add to Wishlist');
        return { data: true, error: null };
    } catch (err) {
        return { data: false, error: 'Connection timeout. Please try again.' };
    }
};

export const removeFromWishlist = async (
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean>> => {
    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();
            return await supabase
                .from('wishlist')
                .delete()
                .eq('user_id', userId)
                .eq('book_id', bookId);
        });
        if (result.error) return handleDatabaseError(result.error, 'Remove from Wishlist');
        return { data: true, error: null };
    } catch (err) {
        return { data: false, error: 'Connection timeout. Please try again.' };
    }
};
