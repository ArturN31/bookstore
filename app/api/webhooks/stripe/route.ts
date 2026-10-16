import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBackendClient } from '@/utils/db/server';
import { stripe } from '@/data/checkout/CheckoutStripeServer';

export async function POST(req: Request): Promise<Response> {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
        return NextResponse.json(
            { error: 'Webhook signature or secret missing.' },
            { status: 400 },
        );

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid signature.';
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    const supabase = await createBackendClient();

    switch (event.type) {
        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;

            const { data: rpcResult, error: rpcError } = await supabase.rpc(
                'handle_stripe_webhook_transaction',
                {
                    p_event_id: event.id,
                    p_event_type: event.type,
                    p_payment_intent_id: paymentIntentId,
                },
            );

            if (rpcError || !rpcResult || !(rpcResult as { readonly success: boolean }).success) {
                console.error(
                    '[Webhook Error] Failed to process webhook transaction:',
                    rpcError ?? rpcResult,
                );
                const errorMessage = (rpcResult as { readonly error?: string })?.error;
                if (errorMessage === 'ORDER_NOT_FOUND')
                    return NextResponse.json(
                        { received: true, warning: 'Order not found.' },
                        { status: 200 },
                    );
                return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
            }

            break;
        }

        default:
            break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
