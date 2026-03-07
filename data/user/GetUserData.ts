import { PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';

export const getUserData = async (supabase: SupabaseClient) => {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (error) return null;
    return data as User;
};

export const getUserWishlist = async (supabase: SupabaseClient, userID: string) => {
    const { data, error }: PostgrestResponse<Wishlist> = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userID);

    if (error) {
        console.error('Error retrieving wishlisted books:', error);
        return null;
    }
    return data;
};
