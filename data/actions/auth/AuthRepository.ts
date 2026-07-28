import {
    SignInWithPasswordCredentials,
    SignUpWithPasswordCredentials,
    SupabaseClient,
    User,
    Session,
} from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

export const updateAccountPassword = async (
    supabase: SupabaseClient<Database>,
    password: string,
): Promise<SafeQueryResult<{ user: User | null }>> => {
    return safeSupabaseQuery<{ user: User | null }>(async () => {
        return await supabase.auth.updateUser({ password });
    });
};

export const terminateSession = async (
    supabase: SupabaseClient<Database>,
): Promise<SafeQueryResult<Record<string, never>>> => {
    return safeSupabaseQuery<Record<string, never>>(async () => {
        const { error } = await supabase.auth.signOut();
        return { data: {}, error };
    });
};

export const authenticateUser = async (
    supabase: SupabaseClient<Database>,
    credentials: SignInWithPasswordCredentials,
): Promise<SafeQueryResult<{ user: User | null; session: Session | null }>> => {
    return safeSupabaseQuery<{ user: User | null; session: Session | null }>(async () => {
        return await supabase.auth.signInWithPassword(credentials);
    });
};

export const registerUser = async (
    supabase: SupabaseClient<Database>,
    credentials: SignUpWithPasswordCredentials,
): Promise<SafeQueryResult<{ user: User | null; session: Session | null }>> => {
    return safeSupabaseQuery<{ user: User | null; session: Session | null }>(async () => {
        return await supabase.auth.signUp(credentials);
    });
};
