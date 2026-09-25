/**
 * @jest-environment node
 */

import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/data/checkout/CheckoutUtils';
import { createBackendClient } from '@/utils/db/server';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body, init) => ({
            json: async () => body,
            status: init?.status ?? 200,
        })),
    },
}));

jest.mock('@/data/checkout/CheckoutUtils', () => ({
    stripe: {
        webhooks: {
            constructEvent: jest.fn(),
        },
        customers: {
            create: jest.fn(),
        },
    },
}));

jest.mock('@/utils/db/server');

describe('Stripe Webhook API Route', () => {
    const originalEnv = process.env;
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            STRIPE_WEBHOOK_SECRET: 'whsec_test123',
        };

        mockSupabase = {
            from: jest.fn(),
            rpc: jest.fn(),
        };

        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const createRequest = (signatureHeader?: string, bodyContent = '{"id":"evt_123"}') => {
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

    it('should return 400 when stripe-signature header is missing', async () => {
        const req = createRequest(undefined);
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json).toEqual({ error: 'Webhook signature or secret missing.' });
    });

    it('should return 400 when STRIPE_WEBHOOK_SECRET is missing', async () => {
        delete process.env.STRIPE_WEBHOOK_SECRET;
        const req = createRequest('sig_123');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json).toEqual({ error: 'Webhook signature or secret missing.' });
    });

    it('should return 400 when constructEvent throws an Error instance', async () => {
        jest.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
            throw new Error('Invalid signature payload');
        });

        const req = createRequest('sig_invalid');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json).toEqual({ error: 'Webhook Error: Invalid signature payload' });
    });

    it('should return 400 when constructEvent throws a non-Error object', async () => {
        jest.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
            throw 'String signature error';
        });

        const req = createRequest('sig_invalid');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json).toEqual({ error: 'Webhook Error: Invalid signature.' });
    });

    describe('payment_intent.succeeded', () => {
        it('should return 404 when order record is not found', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: { id: 'pi_missing_123' } },
            } as never);

            const mockSingle = jest
                .fn()
                .mockResolvedValue({ data: null, error: { message: 'Not found' } });
            const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
            const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
            const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ update: mockUpdate });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(404);
            expect(json).toEqual({ error: 'Order not found.' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should successfully update order to paid and clear shopping cart items', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: { id: 'pi_success_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: { id: 'order_123', user_id: 'user_123' },
                error: null,
            });
            const mockCartSingle = jest.fn().mockResolvedValue({
                data: { id: 'cart_123' },
                error: null,
            });
            const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'shopping_carts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: mockCartSingle,
                            }),
                        }),
                    };
                }
                if (table === 'shopping_cart_items') {
                    return {
                        delete: jest.fn().mockReturnValue({
                            eq: mockDeleteEq,
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
            expect(mockDeleteEq).toHaveBeenCalledWith('cart_id', 'cart_123');
        });

        it('should successfully update order to paid when shopping cart is not found', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: { id: 'pi_success_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: { id: 'order_123', user_id: 'user_123' },
                error: null,
            });
            const mockCartSingle = jest.fn().mockResolvedValue({
                data: null,
                error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'shopping_carts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: mockCartSingle,
                            }),
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
        });
    });

    describe('payment_intent.payment_failed & payment_intent.canceled', () => {
        it('should handle payment_intent.canceled and restore stock via increment_book_stock RPC', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.canceled',
                data: { object: { id: 'pi_cancel_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: { id: 'order_123' },
                error: null,
            });
            const mockItemsSelect = jest.fn().mockResolvedValue({
                data: [{ book_id: 'book_1', quantity: 2 }],
                error: null,
            });

            mockSupabase.rpc.mockResolvedValue({ error: null });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'order_items') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: mockItemsSelect,
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
            expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_book_stock', {
                p_book_id: 'book_1',
                p_quantity: 2,
            });
        });

        it('should fallback to direct book update when increment_book_stock RPC fails', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.payment_failed',
                data: { object: { id: 'pi_fail_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: { id: 'order_123' },
                error: null,
            });
            const mockItemsSelect = jest.fn().mockResolvedValue({
                data: [{ book_id: 'book_1', quantity: 3 }],
                error: null,
            });
            const mockBookSingle = jest.fn().mockResolvedValue({
                data: { stock_quantity: 10, sales_count: 5 },
                error: null,
            });
            const mockBookUpdateEq = jest.fn().mockResolvedValue({ error: null });

            mockSupabase.rpc.mockResolvedValue({ error: { message: 'RPC not available' } });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'order_items') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: mockItemsSelect,
                        }),
                    };
                }
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: mockBookSingle,
                            }),
                        }),
                        update: jest.fn().mockReturnValue({
                            eq: mockBookUpdateEq,
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
            expect(mockBookUpdateEq).toHaveBeenCalledWith('id', 'book_1');
        });

        it('should handle fallback book update gracefully when book row is not found', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.payment_failed',
                data: { object: { id: 'pi_fail_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: { id: 'order_123' },
                error: null,
            });
            const mockItemsSelect = jest.fn().mockResolvedValue({
                data: [{ book_id: 'book_1', quantity: 3 }],
                error: null,
            });
            const mockBookSingle = jest.fn().mockResolvedValue({
                data: null,
                error: null,
            });

            mockSupabase.rpc.mockResolvedValue({ error: { message: 'RPC error' } });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'order_items') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: mockItemsSelect,
                        }),
                    };
                }
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: mockBookSingle,
                            }),
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
        });

        it('should do nothing if order is missing during failure handling', async () => {
            jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
                type: 'payment_intent.payment_failed',
                data: { object: { id: 'pi_missing_123' } },
            } as never);

            const mockOrderSingle = jest.fn().mockResolvedValue({
                data: null,
                error: null,
            });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'orders') {
                    return {
                        update: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                select: jest.fn().mockReturnValue({
                                    single: mockOrderSingle,
                                }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const req = createRequest('sig_valid');
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual({ received: true });
        });
    });

    it('should return 200 for unhandled event types', async () => {
        jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
            type: 'customer.created',
            data: { object: {} },
        } as never);

        const req = createRequest('sig_valid');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ received: true });
    });

    it('should handle fallback book update correctly when sales_count is null', async () => {
        jest.mocked(stripe.webhooks.constructEvent).mockReturnValue({
            type: 'payment_intent.payment_failed',
            data: { object: { id: 'pi_fail_null_sales' } },
        } as never);

        const mockOrderSingle = jest.fn().mockResolvedValue({
            data: { id: 'order_123' },
            error: null,
        });
        const mockItemsSelect = jest.fn().mockResolvedValue({
            data: [{ book_id: 'book_1', quantity: 2 }],
            error: null,
        });
        const mockBookSingle = jest.fn().mockResolvedValue({
            data: { stock_quantity: 10, sales_count: null },
            error: null,
        });
        const mockBookUpdateEq = jest.fn().mockResolvedValue({ error: null });
        const mockBookUpdate = jest.fn().mockReturnValue({ eq: mockBookUpdateEq });

        mockSupabase.rpc.mockResolvedValue({ error: { message: 'RPC not available' } });

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                return {
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: mockOrderSingle,
                            }),
                        }),
                    }),
                };
            }
            if (table === 'order_items') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: mockItemsSelect,
                    }),
                };
            }
            if (table === 'books') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: mockBookSingle,
                        }),
                    }),
                    update: mockBookUpdate,
                };
            }
            return {};
        });

        const req = createRequest('sig_valid');
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ received: true });
        expect(mockBookUpdate).toHaveBeenCalledWith({
            stock_quantity: 12,
            sales_count: 0,
        });
        expect(mockBookUpdateEq).toHaveBeenCalledWith('id', 'book_1');
    });
});
