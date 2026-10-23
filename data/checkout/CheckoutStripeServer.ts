import 'server-only';
import Stripe from 'stripe';
import { DEFAULT_CURRENCY } from '@/data/checkout/CheckoutConstants';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeClient) {
        const rawKey = process.env.STRIPE_SECRET_KEY;
        const secretKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : '';
        if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
        stripeClient = new Stripe(secretKey);
    }
    return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
    get(_target, prop: keyof Stripe) {
        const client = getStripe();
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

export interface PaymentIntentResult {
    readonly success: boolean;
    readonly clientSecret: string | null;
    readonly paymentIntentId: string | null;
    readonly error: string | null;
}

export async function createPaymentIntentAction(
    totalAmountInCents: number,
    idempotencyKey: string,
    currency: string = DEFAULT_CURRENCY,
    metadata?: Record<string, string>,
    customerId?: string | null,
): Promise<PaymentIntentResult> {
    try {
        const paymentIntent = await getStripe().paymentIntents.create(
            {
                amount: totalAmountInCents,
                currency: currency.toLowerCase(),
                customer: customerId ?? undefined,
                automatic_payment_methods: { enabled: true },
                metadata: metadata ?? {},
            },
            { idempotencyKey },
        );

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            error: null,
        };
    } catch (err: unknown) {
        return {
            success: false,
            clientSecret: null,
            paymentIntentId: null,
            error: err instanceof Error ? err.message : 'Failed to initialize payment gateway.',
        };
    }
}

export async function cancelPaymentIntentAction(
    paymentIntentId: string,
): Promise<{ readonly success: boolean; readonly error: string | null }> {
    try {
        await getStripe().paymentIntents.cancel(paymentIntentId);
        return { success: true, error: null };
    } catch (err: unknown) {
        try {
            const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status === 'canceled') return { success: true, error: null };
        } catch (verificationError: unknown) {
            const verificationMessage =
                verificationError instanceof Error
                    ? verificationError.message
                    : 'Payment intent status could not be verified.';
            return {
                success: false,
                error: `Cancellation failed and payment intent status could not be verified: ${verificationMessage}`,
            };
        }

        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to cancel the payment intent.',
        };
    }
}
