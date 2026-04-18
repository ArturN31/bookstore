import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const updateUsername = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    newUsername: string,
) => {
    return supabase.from('users').update({ username: newUsername }).eq('id', userId);
};
