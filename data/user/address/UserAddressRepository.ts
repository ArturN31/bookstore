import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { USER_TABLE } from '../UserConstants';

type UserTable = Database['public']['Tables']['users'];
type UserInsert = UserTable['Insert'];
type UserUpdate = UserTable['Update'];
type UserRow = UserTable['Row'];

export const insertUserAddress = async (
    supabase: SupabaseClient<Database>,
    payload: UserInsert,
): Promise<SafeQueryResult<UserRow[]>> => {
    return safeSupabaseQuery(async () => {
        return await supabase.from(USER_TABLE).insert(payload).select();
    });
};

export const updateUserAddress = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    payload: UserUpdate,
): Promise<SafeQueryResult<UserRow[]>> => {
    return safeSupabaseQuery(async () => {
        return await supabase.from(USER_TABLE).update(payload).eq('id', userId).select();
    });
};
