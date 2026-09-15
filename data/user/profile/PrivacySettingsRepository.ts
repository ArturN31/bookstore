import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export interface UpdatePrivacySettingsPayload {
    is_profile_public?: boolean;
    is_wishlist_public?: boolean;
    are_reviews_public?: boolean;
    wishlist_share_token?: string | null;
    updated_at?: string;
}

export const fetchPublicUserProfileByUsername = async (
    supabase: SupabaseClient<Database>,
    username: string,
) => {
    return supabase.rpc('get_public_profile', { target_username: username }).maybeSingle();
};

export const fetchUserPrivacySettingsById = async (
    supabase: SupabaseClient<Database>,
    userId: string,
) => {
    return supabase
        .from('users')
        .select('is_profile_public, is_wishlist_public, are_reviews_public, wishlist_share_token')
        .eq('id', userId)
        .maybeSingle();
};

export const updateUserPrivacySettingsById = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    payload: UpdatePrivacySettingsPayload,
) => {
    return supabase.from('users').update(payload).eq('id', userId);
};
