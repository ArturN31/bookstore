/**
 * @jest-environment node
 */

import { GET } from '@/app/api/cron/reconcile/route';
import { stripe } from '@/data/checkout/CheckoutStripeServer';
import { createAdminClient } from '@/utils/db/admin';

interface TestStaleOrder {
    id: string;
    stripe_payment_intent_id: string | null;
    status: string;
    created_at: string;
}

interface TestUnmatchedEvent {
    event_id: string;
    event_type: string;
    created_at: string;
    status: string;
}

interface JsonResponseInit {
    status?: number;
}

interface SupabaseClientMock {
    from: jest.Mock;
    rpc: jest.Mock;
}

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body: unknown, init?: JsonResponseInit) => ({
            json: async (): Promise<unknown> => body,
            status: init?.status ?? 200,
        })),
    },
}));

jest.mock('@/data/checkout/CheckoutStripeServer', () => ({
    stripe: {
        paymentIntents: {
            retrieve: jest.fn(),
        },
        events: {
            retrieve: jest.fn(),
        },
    },
}));

jest.mock('@/utils/db/admin');

describe('Reconciliation Cron API Route - Comprehensive Suite', () => {
    const originalEnv = process.env;
    let mockSupabase: SupabaseClientMock;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            CRON_SECRET: 'test_cron_secret',
        };

        mockSupabase = {
            from: jest.fn(),
            rpc: jest.fn(),
        };

        jest.mocked(createAdminClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createAdminClient>>,
        );
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const createRequest = (authHeader?: string): Request => {
        return {
            headers: {
                get: (name: string): string | null => {
                    if (name.toLowerCase() === 'authorization') {
                        return authHeader ?? null;
                    }
                    return null;
                },
            },
        } as unknown as Request;
    };

    it('should return 401 when CRON_SECRET is not configured on the server', async () => {
        delete process.env.CRON_SECRET;
        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { error: string };

        expect(res.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when authorization header is incorrect', async () => {
        const req = createRequest('Bearer wrong_secret');
        const res = await GET(req);
        const json = (await res.json()) as { error: string };

        expect(res.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('should handle database fetch error for stale orders gracefully', async () => {
        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Database failure on orders' },
                        }),
                    }),
                }),
            }),
        });

        mockSupabase.from.mockReturnValue({
            select: mockOrdersSelect,
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { error: string };

        expect(res.status).toBe(500);
        expect(json.error).toContain('Failed to fetch stale orders');
    });

    it('should handle database fetch error for unmatched events gracefully', async () => {
        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Database failure on webhook_events' },
                    }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { error: string };

        expect(res.status).toBe(500);
        expect(json.error).toContain('Failed to fetch unmatched events');
    });

    it('should handle top-level non-Error exception throwing default Internal Server Error', async () => {
        mockSupabase.from.mockImplementation(() => {
            throw 'Non-Error string failure';
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { error: string };

        expect(res.status).toBe(500);
        expect(json.error).toBe('Internal Server Error');
    });

    it('should return early when stale orders query returns null data', async () => {
        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as {
            success: boolean;
            summary: { processedStaleOrders: number };
        };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.processedStaleOrders).toBe(0);
    });

    it('should return early when unmatched events query returns null data', async () => {
        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as {
            success: boolean;
            summary: { processedUnmatchedEvents: number };
        };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.processedUnmatchedEvents).toBe(0);
    });

    it('should catch standard Error instances in processStaleOrders and record the error message', async () => {
        const mockStaleOrders: TestStaleOrder[] = [
            {
                id: 'ord_err_std',
                stripe_payment_intent_id: 'pi_err_std',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        jest.mocked(stripe.paymentIntents.retrieve).mockRejectedValueOnce(
            new Error('Stripe API standard error'),
        );

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors).toContain(
            'Order ord_err_std Stripe/Process error: Stripe API standard error',
        );
    });

    it('should catch non-Error exceptions in processStaleOrders and record "Unknown error"', async () => {
        const mockStaleOrders: TestStaleOrder[] = [
            {
                id: 'ord_err_non',
                stripe_payment_intent_id: 'pi_err_non',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        jest.mocked(stripe.paymentIntents.retrieve).mockRejectedValueOnce('raw string rejection');

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors).toContain(
            'Order ord_err_non Stripe/Process error: Unknown error',
        );
    });

    it('should catch standard Error instances in processUnmatchedEvents and record the error message', async () => {
        const mockStaleOrders: TestStaleOrder[] = [];
        const mockUnmatchedEvents: TestUnmatchedEvent[] = [
            {
                event_id: 'evt_err_std',
                event_type: 'payment_intent.succeeded',
                created_at: new Date().toISOString(),
                status: 'order_not_found',
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockUnmatchedEvents, error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        jest.mocked(stripe.events.retrieve).mockRejectedValueOnce(
            new Error('Stripe event standard error'),
        );

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors).toContain(
            'Event evt_err_std reconciliation error: Stripe event standard error',
        );
    });

    it('should catch non-Error exceptions in processUnmatchedEvents and record "Unknown error"', async () => {
        const mockStaleOrders: TestStaleOrder[] = [];
        const mockUnmatchedEvents: TestUnmatchedEvent[] = [
            {
                event_id: 'evt_err_non',
                event_type: 'payment_intent.succeeded',
                created_at: new Date().toISOString(),
                status: 'order_not_found',
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockUnmatchedEvents, error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        jest.mocked(stripe.events.retrieve).mockRejectedValueOnce({ code: 'some_object_error' });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors).toContain(
            'Event evt_err_non reconciliation error: Unknown error',
        );
    });

    it('should skip orders missing payment intent ID, map various statuses, and handle RPC errors', async () => {
        const mockStaleOrders: TestStaleOrder[] = [
            {
                id: 'ord_no_pi',
                stripe_payment_intent_id: null,
                status: 'pending',
                created_at: new Date().toISOString(),
            },
            {
                id: 'ord_canceled',
                stripe_payment_intent_id: 'pi_canceled',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
            {
                id: 'ord_failed',
                stripe_payment_intent_id: 'pi_failed',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
            {
                id: 'ord_req_pm',
                stripe_payment_intent_id: 'pi_req_pm',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
            {
                id: 'ord_unhandled',
                stripe_payment_intent_id: 'pi_unhandled',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
            {
                id: 'ord_rpc_err',
                stripe_payment_intent_id: 'pi_rpc_err',
                status: 'pending',
                created_at: new Date().toISOString(),
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') return { select: mockOrdersSelect };
            if (table === 'webhook_events') return { select: mockEventsSelect };
            return {};
        });

        jest.mocked(stripe.paymentIntents.retrieve).mockImplementation(async (id: string) => {
            if (id === 'pi_canceled')
                return { id, status: 'canceled' } as unknown as Awaited<
                    ReturnType<typeof stripe.paymentIntents.retrieve>
                >;
            if (id === 'pi_failed')
                return { id, status: 'payment_failed' } as unknown as Awaited<
                    ReturnType<typeof stripe.paymentIntents.retrieve>
                >;
            if (id === 'pi_req_pm')
                return { id, status: 'requires_payment_method' } as unknown as Awaited<
                    ReturnType<typeof stripe.paymentIntents.retrieve>
                >;
            if (id === 'pi_unhandled')
                return { id, status: 'processing' } as unknown as Awaited<
                    ReturnType<typeof stripe.paymentIntents.retrieve>
                >;
            if (id === 'pi_rpc_err')
                return { id, status: 'succeeded' } as unknown as Awaited<
                    ReturnType<typeof stripe.paymentIntents.retrieve>
                >;
            return { id, status: 'succeeded' } as unknown as Awaited<
                ReturnType<typeof stripe.paymentIntents.retrieve>
            >;
        });

        mockSupabase.rpc.mockResolvedValue({
            data: null,
            error: { message: 'RPC transaction failed' },
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors.length).toBeGreaterThan(0);
    });

    it('should process unmatched events handling missing object, un-found orders, and RPC errors', async () => {
        const mockStaleOrders: TestStaleOrder[] = [];
        const mockUnmatchedEvents: TestUnmatchedEvent[] = [
            {
                event_id: 'evt_no_pi',
                event_type: 'payment_intent.succeeded',
                created_at: new Date().toISOString(),
                status: 'order_not_found',
            },
            {
                event_id: 'evt_no_match',
                event_type: 'payment_intent.succeeded',
                created_at: new Date().toISOString(),
                status: 'order_not_found',
            },
            {
                event_id: 'evt_rpc_err',
                event_type: 'payment_intent.succeeded',
                created_at: new Date().toISOString(),
                status: 'order_not_found',
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockUnmatchedEvents, error: null }),
                }),
            }),
        });

        const mockOrderMatchSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'ord_matched' }, error: null }),
            }),
        });

        const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
        const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders')
                return {
                    select: jest.fn((fields?: string) => {
                        if (fields === 'id') return mockOrderMatchSelect();
                        return mockOrdersSelect();
                    }),
                };
            if (table === 'webhook_events')
                return {
                    select: mockEventsSelect,
                    delete: mockDelete,
                };
            return {};
        });

        jest.mocked(stripe.events.retrieve).mockImplementation(async (id: string) => {
            if (id === 'evt_no_pi')
                return {
                    id,
                    type: 'payment_intent.succeeded',
                    data: { object: {} },
                } as unknown as Awaited<ReturnType<typeof stripe.events.retrieve>>;
            if (id === 'evt_no_match')
                return {
                    id,
                    type: 'payment_intent.succeeded',
                    data: { object: { id: 'pi_unmatched' } },
                } as unknown as Awaited<ReturnType<typeof stripe.events.retrieve>>;
            return {
                id,
                type: 'payment_intent.succeeded',
                data: { object: { id: 'pi_matched' } },
            } as unknown as Awaited<ReturnType<typeof stripe.events.retrieve>>;
        });

        mockSupabase.rpc.mockResolvedValue({
            data: null,
            error: { message: 'RPC error on event reconciliation' },
        });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as { success: boolean; summary: { errors: string[] } };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.errors.length).toBeGreaterThan(0);
    });

    it('should successfully process valid stale orders and unmatched events with zero errors', async () => {
        const mockStaleOrders: TestStaleOrder[] = [
            {
                id: 'ord_123',
                stripe_payment_intent_id: 'pi_123',
                status: 'pending',
                created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
            },
        ];

        const mockUnmatchedEvents: TestUnmatchedEvent[] = [
            {
                event_id: 'evt_123',
                event_type: 'payment_intent.succeeded',
                created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                status: 'order_not_found',
            },
        ];

        const mockOrdersSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                    lt: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockStaleOrders, error: null }),
                    }),
                }),
            }),
        });

        const mockEventsSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockUnmatchedEvents, error: null }),
                }),
            }),
        });

        const mockOrderMatchSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'ord_123' }, error: null }),
            }),
        });

        const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
        const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders')
                return {
                    select: jest.fn((fields?: string) => {
                        if (fields === 'id') return mockOrderMatchSelect();
                        return mockOrdersSelect();
                    }),
                };
            if (table === 'webhook_events')
                return {
                    select: mockEventsSelect,
                    delete: mockDelete,
                };
            return {};
        });

        jest.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({
            id: 'pi_123',
            status: 'succeeded',
        } as unknown as Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>);

        jest.mocked(stripe.events.retrieve).mockResolvedValue({
            id: 'evt_123',
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_123' } },
        } as unknown as Awaited<ReturnType<typeof stripe.events.retrieve>>);

        mockSupabase.rpc.mockResolvedValue({ data: { success: true }, error: null });

        const req = createRequest('Bearer test_cron_secret');
        const res = await GET(req);
        const json = (await res.json()) as {
            success: boolean;
            summary: {
                processedStaleOrders: number;
                processedUnmatchedEvents: number;
                errors: string[];
            };
        };

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.summary.processedStaleOrders).toBe(1);
        expect(json.summary.processedUnmatchedEvents).toBe(1);
        expect(json.summary.errors).toHaveLength(0);
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });
});
