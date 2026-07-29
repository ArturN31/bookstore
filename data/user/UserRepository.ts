import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const fetchUserProfileById = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('users').select('*').eq('id', userId).maybeSingle();
};

export const fetchWishlistByUserId = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('wishlist').select('*').eq('user_id', userId);
};

export const fetchUserAuthData = async (supabase: SupabaseClient<Database>) => {
    return supabase.auth.getUser();
};
