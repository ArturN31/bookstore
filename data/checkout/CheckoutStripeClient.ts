import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripeHeader = (): Promise<Stripe | null> => {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    if (!stripePromise) {
        const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        const publishableKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : '';

        if (!publishableKey || !publishableKey.startsWith('pk_')) {
            console.error(
                '[Stripe Error] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid.',
            );
            return Promise.resolve(null);
        }

        stripePromise = loadStripe(publishableKey).catch((err: unknown) => {
            console.error('[Stripe Error] Failed to load Stripe.js SDK script:', err);
            stripePromise = null;
            return null;
        });
    }

    return stripePromise;
};
