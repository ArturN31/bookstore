import { createBackendClient } from '@/utils/db/server';
import { Database } from '@/database.types';
import { withRetry } from '@/utils/network/retry';
import { fetchUserAuthData, fetchUserProfileById } from '../repositories/CheckoutUserRepository';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

type UserProfileRow = Database['public']['Tables']['users']['Row'];

export interface UserCheckoutData {
    readonly id: string;
    readonly email: string;
    readonly profile: UserProfileRow | null;
    // TODO: Add optional stripeCustomerId?: string to UserCheckoutData interface once Stripe Customer IDs are stored in DB profile.
}

export const getCurrentUserCheckoutData = async (): Promise<SafeQueryResult<UserCheckoutData>> => {
    try {
        const supabase = await createBackendClient();

        const authResult = await withRetry(() => fetchUserAuthData(supabase));
        if (authResult.error || !authResult.data.user)
            return {
                data: null,
                error: authResult.error
                    ? sanitizeSupabaseError(authResult.error)
                    : APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
            };

        const user = authResult.data.user;

        const profileResult = await safeSupabaseQuery<UserProfileRow>(() =>
            withRetry(() => fetchUserProfileById(supabase, user.id)),
        );

        // TODO: Check if user has an existing Stripe Customer ID in user_metadata or profiles, or initiate creation via stripe.customers.create().
        return {
            data: {
                id: user.id,
                email: user.email ?? '',
                profile: profileResult.data,
            },
            error: null,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
