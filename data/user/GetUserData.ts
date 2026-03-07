'use server';

import { createBackendClient } from '@/utils/db/server';

export const getUserData = async () => {
    const supabase = await createBackendClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (error) return null;
    return data as User;
};

export const getUserWishlist = async (userID: string) => {
    const supabase = await createBackendClient();

    const { data, error } = await supabase.from('wishlist').select('*').eq('user_id', userID);

    if (error) {
        console.error('Error retrieving wishlisted books:', {
            code: error.code,
            message: error.message,
            details: error.details,
        });
        return null;
    }

    return data;
};
