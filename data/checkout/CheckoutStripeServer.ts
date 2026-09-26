import 'server-only';
import Stripe from 'stripe';
import { DEFAULT_CURRENCY } from '@/data/checkout/CheckoutConstants';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    httpClient: Stripe.createFetchHttpClient(),
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
        const paymentIntent = await stripe.paymentIntents.create(
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
