import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';

type UserRow = Database['public']['Tables']['users']['Row'];

export const updateUsername = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    newUsername: string,
): Promise<SafeQueryResult<UserRow[]>> => {
    return safeSupabaseQuery(async () =>
        supabase.from('users').update({ username: newUsername }).eq('id', userId).select(),
    );
};
