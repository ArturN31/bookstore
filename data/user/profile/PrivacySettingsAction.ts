'use server';

import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { buildRateLimitIdentifiers, verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { PRIVACY_SETTINGS_ACTIONS } from './PrivacySettingsConstants';
import { UpdatePrivacySettingsPayload } from './PrivacySettingsRepository';
import {
    generateOrResetWishlistShareToken,
    updateUserPrivacySettings,
} from './PrivacySettingsService';
import { revalidateUserPrivacyPaths, verifyAuthorizedUser } from './PrivacySettingsUtils';

export interface ActionResult<T = null> {
    success: boolean;
    data?: T;
    error?: string;
}

export const updatePrivacySettingsAction = async (
    targetUserId: string,
    payload: UpdatePrivacySettingsPayload,
): Promise<ActionResult> => {
    try {
        const authResult = await verifyAuthorizedUser(
            targetUserId,
            PRIVACY_SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS,
            payload,
        );
        if (authResult.error || !authResult.user)
            return {
                success: false,
                error: authResult.error ?? 'Unauthorized',
            };

        const rateLimit = await verifyRateLimit({
            identifiers: buildRateLimitIdentifiers(await getAppClientIp(), authResult.user.id),
            limiter: limiters.userMutation,
            failClosed: true,
        });

        if (!rateLimit.success)
            return {
                success: false,
                error: rateLimit.error ?? 'Too many privacy update requests. Please slow down.',
            };

        const { error: updateError } = await updateUserPrivacySettings(authResult.user.id, payload);
        if (updateError)
            return {
                success: false,
                error: updateError,
            };

        const supabase = await createBackendClient();
        await revalidateUserPrivacyPaths(supabase, authResult.user.id, {
            includeReviewsAndPublicProfile: true,
        });

        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: sanitizeSupabaseError(err),
        };
    }
};

export const regenerateWishlistShareTokenAction = async (
    targetUserId: string,
): Promise<ActionResult<{ token: string }>> => {
    try {
        const authResult = await verifyAuthorizedUser(
            targetUserId,
            PRIVACY_SETTINGS_ACTIONS.REGENERATE_WISHLIST_SHARE_TOKEN,
        );
        if (authResult.error || !authResult.user)
            return {
                success: false,
                error: authResult.error ?? 'Unauthorized',
            };

        const rateLimit = await verifyRateLimit({
            identifiers: buildRateLimitIdentifiers(await getAppClientIp(), authResult.user.id),
            limiter: limiters.userMutation,
            failClosed: true,
        });

        if (!rateLimit.success)
            return {
                success: false,
                error: rateLimit.error ?? 'Too many token generation requests. Please slow down.',
            };

        const { token, error: generateError } = await generateOrResetWishlistShareToken(
            authResult.user.id,
        );
        if (generateError || !token)
            return {
                success: false,
                error: generateError ?? 'Failed to generate token',
            };

        const supabase = await createBackendClient();
        await revalidateUserPrivacyPaths(supabase, authResult.user.id);

        return { success: true, data: { token } };
    } catch (err: unknown) {
        return {
            success: false,
            error: sanitizeSupabaseError(err),
        };
    }
};
