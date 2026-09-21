'use server';

import { revalidatePath } from 'next/cache';
import { createBackendClient } from '@/utils/db/server';
import { updateWishlistVisibilityAndToken } from './WishlistShareRepository';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

export async function updateWishlistVisibilityAction(
    userId: string,
    isPublic: boolean,
    newToken?: string,
): Promise<{ error: string | null }> {
    try {
        const supabase = await createBackendClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            await recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {
                targetUserId: userId,
                action: 'UPDATE_WISHLIST_VISIBILITY',
                reason: authError?.message ?? APP_ERROR_MESSAGES.ERROR_AUTH_FAILED,
            });
            return { error: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER };
        }

        if (user.id !== userId) {
            await recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', user.id, {
                targetUserId: userId,
                action: 'UPDATE_WISHLIST_VISIBILITY',
                reason: 'Authenticated user ID does not match target user ID',
            });
            return { error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS };
        }

        const result = await updateWishlistVisibilityAndToken(
            userId,
            isPublic,
            isPublic ? null : newToken,
        );

        if (result.error) return { error: result.error };

        revalidatePath('/user/profile/public/[username]', 'layout');
        revalidatePath('/user/wishlist/[username]', 'layout');

        return { error: null };
    } catch (err: unknown) {
        return { error: sanitizeSupabaseError(err, userId) };
    }
}
