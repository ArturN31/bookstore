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
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('stripe_payment_intent_id', paymentIntentId)
                .select('id, user_id')
                .single();

            if (orderError || !order) {
                console.error('Failed to update order status to paid:', orderError);
                return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
            }

            const { data: cart } = await supabase
                .from('shopping_carts')
                .select('id')
                .eq('user_id', order.user_id)
                .single();

            if (cart) {
                await supabase.from('shopping_cart_items').delete().eq('cart_id', cart.id);
            }

            break;
        }

        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;
            const nextStatus = event.type === 'payment_intent.canceled' ? 'cancelled' : 'failed';

            const { data: order } = await supabase
                .from('orders')
                .update({ status: nextStatus })
                .eq('stripe_payment_intent_id', paymentIntentId)
                .select('id')
                .single();

            if (order) {
                const { data: items } = await supabase
                    .from('order_items')
                    .select('book_id, quantity')
                    .eq('order_id', order.id);

                if (items) {
                    for (const item of items) {
                        const { error: rpcError } = await supabase.rpc('increment_book_stock', {
                            p_book_id: item.book_id,
                            p_quantity: item.quantity,
                        });

                        if (rpcError) {
                            const { data: book } = await supabase
                                .from('books')
                                .select('stock_quantity, sales_count')
                                .eq('id', item.book_id)
                                .single();

                            if (book)
                                await supabase
                                    .from('books')
                                    .update({
                                        stock_quantity: book.stock_quantity + item.quantity,
                                        sales_count: Math.max(
                                            0,
                                            (book.sales_count ?? 0) - item.quantity,
                                        ),
                                    })
                                    .eq('id', item.book_id);
                        }
                    }
                }
            }
            break;
        }

        default:
            break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
