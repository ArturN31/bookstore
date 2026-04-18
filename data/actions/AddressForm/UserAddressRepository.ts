import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

type UserTable = Database['public']['Tables']['users'];
type UserInsert = UserTable['Insert'];
type UserUpdate = UserTable['Update'];

export const insertUserAddress = async (
    supabase: SupabaseClient<Database>,
    payload: UserInsert,
) => {
    return supabase.from('users').insert(payload);
};

export const updateUserAddress = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    payload: UserUpdate,
) => {
    return supabase.from('users').update(payload).eq('id', userId);
};
