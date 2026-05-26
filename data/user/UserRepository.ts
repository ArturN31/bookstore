import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { UserConstants, UserRepositoryLogPrefix, UserServiceLogPrefix } from './UserConstants';

type UserEmailResponse = {
    email: string | null;
    userID: string | null;
};

export const fetchUserProfileById = async (
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<ActionResponse<UserDB>> => {
    try {
        if (!supabase) {
            console.error(`${UserRepositoryLogPrefix} ${UserConstants.ERROR_SUPABASE_FAILED}`);
            return { data: null, error: UserConstants.ERROR_SUPABASE_FAILED };
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('[UserRepository] Error fetching user:', error);
            return { data: null, error: UserConstants.ERROR_PROFILE_FETCH_FAILED };
        }

        if (!data) {
            console.error('[UserRepository] User not found');
            return { data: null, error: UserConstants.ERROR_PROFILE_NOT_FOUND };
        }

        return { data, error: null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`${UserRepositoryLogPrefix} Error fetching user profile data:`, errorMessage);
        return { data: null, error: UserConstants.ERROR_DATABASE_QUERY_FAILED };
    }
};

export const fetchWishlistByUserId = async (
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<ActionResponse<Wishlist[]>> => {
    try {
        if (!supabase) {
            console.error(`${UserRepositoryLogPrefix} ${UserConstants.ERROR_SUPABASE_FAILED}`);
            return { data: null, error: UserConstants.ERROR_SUPABASE_FAILED };
        }

        const { data, error } = await supabase.from('wishlist').select('*').eq('user_id', userId);

        if (error) {
            console.error('[UserRepository] Error fetching wishlist:', error);
            return { data: null, error: UserConstants.ERROR_WISHLIST_FETCH_FAILED };
        }

        if (data.length === 0) return { data: [], error: UserConstants.ERROR_WISHLIST_NOT_FOUND };

        return { data, error: null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`${UserRepositoryLogPrefix} Error fetching wishlist:`, errorMessage);
        return { data: null, error: UserConstants.ERROR_DATABASE_QUERY_FAILED };
    }
};

export const fetchUserAuthData = async (
    supabase: SupabaseClient<Database>,
): Promise<ActionResponse<UserEmailResponse>> => {
    try {
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser)
            return { data: { email: null, userID: null }, error: UserConstants.ERROR_AUTH_FAILED };

        const { email, id } = authUser;

        if (!email)
            return {
                data: { email: null, userID: null },
                error: UserConstants.ERROR_EMAIL_NOT_FOUND,
            };

        return { data: { email: email, userID: id }, error: null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`${UserServiceLogPrefix} UserAuth System Error:`, errorMessage);
        return { data: { email: null, userID: null }, error: UserConstants.ERROR_SYSTEM_ERROR };
    }
};
