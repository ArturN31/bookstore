import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/db/admin';
import { stripe } from '@/data/checkout/CheckoutStripeServer';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export interface ReconciliationSummary {
    processedStaleOrders: number;
    processedUnmatchedEvents: number;
    errors: string[];
}

type SupabaseClientInstance = Awaited<ReturnType<typeof createAdminClient>>;

/**
 * Validates the incoming request authorization header against the server CRON_SECRET.
 */
function verifyCronAuthorization(req: Request): boolean {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) return false;
    return true;
}

/**
 * Maps Stripe PaymentIntent status to supported webhook event types.
 */
function mapPaymentIntentStatusToEventType(status: string): string | null {
    if (status === 'succeeded') return 'payment_intent.succeeded';
    if (status === 'canceled') return 'payment_intent.canceled';
    if (status === 'payment_failed' || status === 'requires_payment_method')
        return 'payment_intent.payment_failed';
    return null;
}

/**
 * Processes stale pending orders by verifying their status with Stripe and triggering reconciliation.
 */
async function processStaleOrders(
    supabase: SupabaseClientInstance,
    summary: ReconciliationSummary,
): Promise<void> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, stripe_payment_intent_id, status, created_at')
        .eq('status', 'pending')
        .not('stripe_payment_intent_id', 'is', null)
        .lt('created_at', thirtyMinutesAgo)
        .limit(50);

    if (ordersError) throw new Error(`Failed to fetch stale orders: ${ordersError.message}`);

    if (!staleOrders) return;

    for (const order of staleOrders) {
        if (!order.stripe_payment_intent_id) continue;

        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
                order.stripe_payment_intent_id,
            );

            const mappedEventType = mapPaymentIntentStatusToEventType(paymentIntent.status);

            if (mappedEventType) {
                const reconciliationEventId = `recon_ord_${order.id}_${Date.now()}`;
                const { error: rpcError } = await supabase.rpc(
                    'handle_stripe_webhook_transaction',
                    {
                        p_event_id: reconciliationEventId,
                        p_event_type: mappedEventType,
                        p_payment_intent_id: order.stripe_payment_intent_id,
                    },
                );

                if (rpcError)
                    summary.errors.push(`Order ${order.id} RPC error: ${rpcError.message}`);
                else summary.processedStaleOrders++;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            summary.errors.push(`Order ${order.id} Stripe/Process error: ${message}`);
        }
    }
}

/**
 * Processes unmatched webhook audit events by checking for newly matched orders in the database.
 */
async function processUnmatchedEvents(
    supabase: SupabaseClientInstance,
    summary: ReconciliationSummary,
): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: unmatchedEvents, error: eventsError } = await supabase
        .from('webhook_events')
        .select('event_id, event_type, created_at, status')
        .eq('status', 'order_not_found')
        .lt('created_at', fifteenMinutesAgo)
        .limit(50);

    if (eventsError) throw new Error(`Failed to fetch unmatched events: ${eventsError.message}`);

    if (!unmatchedEvents) return;

    for (const event of unmatchedEvents) {
        try {
            const stripeEvent = await stripe.events.retrieve(event.event_id);
            const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;

            if (paymentIntent && paymentIntent.id) {
                const { data: matchingOrder } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('stripe_payment_intent_id', paymentIntent.id)
                    .single();

                if (matchingOrder) {
                    const { error: deleteError } = await supabase
                        .from('webhook_events')
                        .delete()
                        .eq('event_id', event.event_id);

                    if (deleteError)
                        throw new Error(
                            `Failed to delete webhook event before replay: ${deleteError.message}`,
                        );

                    const { error: rpcError } = await supabase.rpc(
                        'handle_stripe_webhook_transaction',
                        {
                            p_event_id: event.event_id,
                            p_event_type: stripeEvent.type,
                            p_payment_intent_id: paymentIntent.id,
                        },
                    );

                    if (rpcError)
                        summary.errors.push(
                            `Event ${event.event_id} RPC error: ${rpcError.message}`,
                        );
                    else summary.processedUnmatchedEvents++;
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            summary.errors.push(`Event ${event.event_id} reconciliation error: ${message}`);
        }
    }
}

/**
 * Main Cron Route Handler for Payment and Order Reconciliation.
 */
export async function GET(req: Request): Promise<Response> {
    if (!verifyCronAuthorization(req))
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createAdminClient();
    const summary: ReconciliationSummary = {
        processedStaleOrders: 0,
        processedUnmatchedEvents: 0,
        errors: [],
    };

    try {
        await processStaleOrders(supabase, summary);
        await processUnmatchedEvents(supabase, summary);

        return NextResponse.json({ success: true, summary }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[Reconciliation Error]', error);
        return NextResponse.json({ error: message, summary }, { status: 500 });
    }
}
