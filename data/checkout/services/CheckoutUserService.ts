import { createBackendClient } from '@/utils/db/server';
import { Database } from '@/database.types';
import { withRetry } from '@/utils/network/retry';
import { fetchUserAuthData, fetchUserProfileById } from '../repositories/CheckoutUserRepository';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { stripe } from '../CheckoutUtils';

type UserProfileRow = Database['public']['Tables']['users']['Row'];

export interface UserCheckoutData {
    readonly id: string;
    readonly email: string;
    readonly profile: UserProfileRow | null;
    readonly stripeCustomerId: string | null;
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

        let stripeCustomerId: string | null = null;
        const profile = profileResult.data;

        if (profile) {
            stripeCustomerId =
                (profile as unknown as { stripe_customer_id?: string }).stripe_customer_id ?? null;

            if (!stripeCustomerId && user.email) {
                try {
                    const customer = await stripe.customers.create({
                        email: user.email,
                        metadata: { supabaseUserId: user.id },
                    });
                    stripeCustomerId = customer.id;

                    await supabase
                        .from('users')
                        .update({
                            stripe_customer_id: stripeCustomerId,
                        } as unknown as Partial<UserProfileRow>)
                        .eq('id', user.id);
                } catch (stripeErr: unknown) {
                    console.error('Failed to create Stripe customer', stripeErr);
                }
            }
        }

        return {
            data: {
                id: user.id,
                email: user.email ?? '',
                profile: profile,
                stripeCustomerId: stripeCustomerId,
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
