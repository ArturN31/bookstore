import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

type UserRow = Database['public']['Tables']['users']['Row'];

export const fetchUserProfileById = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('users').select('*').eq('id', userId).maybeSingle();
};

export const fetchWishlistByUserId = async (supabase: SupabaseClient<Database>, userId: string) => {
    return supabase.from('wishlist').select('*').eq('user_id', userId);
};

export const fetchUserAuthData = async (supabase: SupabaseClient<Database>) => {
    return supabase.auth.getUser();
};

export const updateUsername = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    newUsername: string,
): Promise<SafeQueryResult<UserRow[]>> => {
    return safeSupabaseQuery(async () =>
        supabase.from('users').update({ username: newUsername }).eq('id', userId).select(),
    );
};
