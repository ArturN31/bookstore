import {
    SignInWithPasswordCredentials,
    SignUpWithPasswordCredentials,
    SupabaseClient,
} from '@supabase/supabase-js';
import { Database } from '@/database.types';

export const updateAccountPassword = async (
    supabase: SupabaseClient<Database>,
    password: string,
) => {
    return supabase.auth.updateUser({ password });
};

export const terminateSession = async (supabase: SupabaseClient<Database>) => {
    return supabase.auth.signOut();
};

export const authenticateUser = async (
    supabase: SupabaseClient<Database>,
    credentials: SignInWithPasswordCredentials,
) => {
    return supabase.auth.signInWithPassword(credentials);
};

export const registerUser = async (
    supabase: SupabaseClient<Database>,
    credentials: SignUpWithPasswordCredentials,
) => {
    return supabase.auth.signUp(credentials);
};
