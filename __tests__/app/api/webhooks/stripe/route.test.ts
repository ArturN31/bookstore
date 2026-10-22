/**
 * @jest-environment node
 */

import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/data/checkout/CheckoutStripeServer';
import { createAdminClient } from '@/utils/db/admin';
import Stripe from 'stripe';

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body: unknown, init?: { status?: number }) => ({
            json: async () => body,
            status: init?.status ?? 200,
        })),
    },
}));

jest.mock('@/data/checkout/CheckoutStripeServer', () => ({
    stripe: {
        webhooks: {
            constructEvent: jest.fn(),
        },
        customers: {
            create: jest.fn(),
        },
    },
}));

jest.mock('@/utils/db/admin');

describe('Stripe Webhook API Route (RPC Architecture)', () => {
    const originalEnv = process.env;
    let mockSupabase: { rpc: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        };

        mockSupabase = {
            rpc: jest.fn(),
        };

        jest.mocked(createAdminClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createAdminClient>>,
        );
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const createRequest = (signatureHeader?: string, bodyContent = '{"id":"evt_123"}'): Request => {
        const headers = new Headers();
        if (signatureHeader) {
            headers.set('stripe-signature', signatureHeader);
        }
        return new Request('http://localhost:3000/api/webhooks/stripe', {
            method: 'POST',
            headers,
            body: bodyContent,
        });
    };

    describe('Signature & Security Validation', () => {
        it('should return 400 when stripe-signature header is missing', async () => {
            const req = createRequest(undefined);
            const res = await POST(req);
            const json = (await res.json()) as { error: string };

            expect(res.status).toBe(400);
            expect(json).toEqual({ error: 'Webhook signature or secret missing.' });
        });

        it('should return 400 when STRIPE_WEBHOOK_SECRET is missing', async () => {
            delete process.env.STRIPE_WEBHOOK_SECRET;
            const req = createRequest('sig_123');
            const res = await POST(req);
            const json = (await res.json()) as { error: string };

            expect(res.status).toBe(400);
            expect(json).toEqual({ error: 'Webhook signature or secret missing.' });
        });

        it('should return 400 when constructEvent throws an Error instance', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
                throw new Error('Invalid signature payload');
            });

            const req = createRequest('sig_invalid');
            const res = await POST(req);
            const json = (await res.json()) as { error: string };

            expect(res.status).toBe(400);
            expect(json).toEqual({ error: 'Webhook Error: Invalid signature payload' });
        });

        it('should return 400 when constructEvent throws a non-Error object', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
                throw 'String signature error';
            });

            const req = createRequest('sig_invalid');
            const res = await POST(req);
            const json = (await res.json()) as { error: string };

            expect(res.status).toBe(400);
            expect(json).toEqual({ error: 'Webhook Error: Invalid signature.' });
        });
    });

    describe('Event Fulfillment via Database RPC', () => {
        it('should successfully process payment_intent.succeeded and return 200', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_success_123',
                object: 'event',
                api_version: '2026-08-26.dahlia',
                created: 1792081325,
                data: {
                    object: {
                        id: 'pi_success_123',
                        object: 'payment_intent',
                    } as Stripe.PaymentIntent,
                },
                livemode: false,
                pending_webhooks: 1,
                request: { id: 'req_123', idempotency_key: 'key_123' },
                type: 'payment_intent.succeeded',
            };

            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);
            mockSupabase.rpc.mockResolvedValue({ data: { success: true }, error: null });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = (await res.json()) as { received: boolean };

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
            expect(mockSupabase.rpc).toHaveBeenCalledWith('handle_stripe_webhook_transaction', {
                p_event_id: 'evt_success_123',
                p_event_type: 'payment_intent.succeeded',
                p_payment_intent_id: 'pi_success_123',
            });
        });

        it('should successfully handle idempotent duplicate delivery skips', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_duplicate_123',
                object: 'event',
                api_version: '2026-08-26.dahlia',
                created: 1792081325,
                data: {
                    object: {
                        id: 'pi_success_123',
                        object: 'payment_intent',
                    } as Stripe.PaymentIntent,
                },
                livemode: false,
                pending_webhooks: 1,
                request: { id: 'req_123', idempotency_key: 'key_123' },
                type: 'payment_intent.succeeded',
            };

            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);
            mockSupabase.rpc.mockResolvedValue({
                data: { success: true, idempotent_skip: true },
                error: null,
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = (await res.json()) as { received: boolean };

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
        });

        it('should return 200 with warning when order is not found in database', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_missing_order',
                object: 'event',
                api_version: '2026-08-26.dahlia',
                created: 1792081325,
                data: {
                    object: {
                        id: 'pi_missing_123',
                        object: 'payment_intent',
                    } as Stripe.PaymentIntent,
                },
                livemode: false,
                pending_webhooks: 1,
                request: { id: 'req_123', idempotency_key: 'key_123' },
                type: 'payment_intent.succeeded',
            };

            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);
            mockSupabase.rpc.mockResolvedValue({
                data: { success: false, error: 'ORDER_NOT_FOUND' },
                error: null,
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = (await res.json()) as { received: boolean; warning?: string };

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true, warning: 'Order not found.' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 when database RPC execution fails with a runtime error', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_dberror_123',
                object: 'event',
                api_version: '2026-08-26.dahlia',
                created: 1792081325,
                data: {
                    object: {
                        id: 'pi_error_123',
                        object: 'payment_intent',
                    } as Stripe.PaymentIntent,
                },
                livemode: false,
                pending_webhooks: 1,
                request: { id: 'req_123', idempotency_key: 'key_123' },
                type: 'payment_intent.succeeded',
            };

            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);
            mockSupabase.rpc.mockResolvedValue({
                data: null,
                error: { message: 'Database connection timeout' },
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = (await res.json()) as { error: string };

            expect(res.status).toBe(500);
            expect(json).toEqual({ error: 'Webhook processing failed.' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 200 for unhandled Stripe event types', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_unhandled_123',
                object: 'event',
                api_version: '2026-08-26.dahlia',
                created: 1792081325,
                data: {
                    object: {} as Stripe.Customer,
                },
                livemode: false,
                pending_webhooks: 1,
                request: { id: 'req_123', idempotency_key: 'key_123' },
                type: 'customer.created',
            };

            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = (await res.json()) as { received: boolean };

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });
    });
});
