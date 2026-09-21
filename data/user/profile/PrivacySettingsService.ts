import { createAdminClient } from '@/utils/db/admin';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';
import {
    fetchPublicUserProfileByUsername,
    fetchUserPrivacySettingsById,
    UpdatePrivacySettingsPayload,
    updateUserPrivacySettingsById,
} from './PrivacySettingsRepository';
import { generateShareToken } from './PrivacySettingsUtils';

export interface PublicProfileDto {
    id: string;
    username: string;
    created_at: string;
    is_wishlist_public: boolean;
    are_reviews_public: boolean;
    is_profile_public: boolean;
}

export interface UserPrivacySettingsDto {
    is_profile_public: boolean;
    is_wishlist_public: boolean;
    are_reviews_public: boolean;
    wishlist_share_token: string | null;
}

export interface ServiceResult<T> {
    data: T | null;
    error: string | null;
}

export const getPublicProfile = async (
    username: string,
): Promise<ServiceResult<PublicProfileDto>> => {
    try {
        return await withRetry(async () => {
            const supabase = await createAdminClient();
            const { data, error } = await fetchPublicUserProfileByUsername(supabase, username);

            if (error) return { data: null, error: sanitizeSupabaseError(error) };
            if (!data) return { data: null, error: null };

            const profile: PublicProfileDto = {
                id: data.id,
                username: data.username,
                created_at: data.created_at,
                is_wishlist_public: data.is_wishlist_public,
                are_reviews_public: data.are_reviews_public,
                is_profile_public: data.is_profile_public,
            };

            return { data: profile, error: null };
        });
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const getUserPrivacySettings = async (
    userId: string,
): Promise<ServiceResult<UserPrivacySettingsDto>> => {
    try {
        const supabase = await createBackendClient();
        const { data, error } = await fetchUserPrivacySettingsById(supabase, userId);

        if (error) return { data: null, error: sanitizeSupabaseError(error, userId) };
        if (!data) return { data: null, error: null };

        const settings: UserPrivacySettingsDto = {
            is_profile_public: data.is_profile_public,
            is_wishlist_public: data.is_wishlist_public,
            are_reviews_public: data.are_reviews_public,
            wishlist_share_token: data.wishlist_share_token,
        };

        return { data: settings, error: null };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err, userId) };
    }
};

export const updateUserPrivacySettings = async (
    userId: string,
    payload: UpdatePrivacySettingsPayload,
): Promise<{ error: string | null }> => {
    try {
        const supabase = await createBackendClient();
        const updatePayload: UpdatePrivacySettingsPayload = {
            ...payload,
            updated_at: new Date().toISOString(),
        };

        if (payload.is_wishlist_public !== undefined) {
            if (payload.is_wishlist_public) {
                updatePayload.wishlist_share_token = null;
            } else if (payload.wishlist_share_token === undefined) {
                const { data: currentSettings } = await fetchUserPrivacySettingsById(
                    supabase,
                    userId,
                );
                if (!currentSettings?.wishlist_share_token)
                    updatePayload.wishlist_share_token = generateShareToken();
            }
        }

        const { error } = await updateUserPrivacySettingsById(supabase, userId, updatePayload);
        if (error) return { error: sanitizeSupabaseError(error, userId) };

        return { error: null };
    } catch (err: unknown) {
        return { error: sanitizeSupabaseError(err, userId) };
    }
};

export const generateOrResetWishlistShareToken = async (
    userId: string,
): Promise<{ token: string | null; error: string | null }> => {
    try {
        const supabase = await createBackendClient();
        const newToken = generateShareToken();
        const updatePayload: UpdatePrivacySettingsPayload = {
            is_wishlist_public: false,
            wishlist_share_token: newToken,
            updated_at: new Date().toISOString(),
        };

        const { error } = await updateUserPrivacySettingsById(supabase, userId, updatePayload);
        if (error) return { token: null, error: sanitizeSupabaseError(error, userId) };

        return { token: newToken, error: null };
    } catch (err: unknown) {
        return { token: null, error: sanitizeSupabaseError(err, userId) };
    }
};
