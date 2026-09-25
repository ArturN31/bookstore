/**
 * @jest-environment node
 */

import {
    executeCheckoutOrder,
    getOrderDetailsById,
} from '@/data/checkout/services/CheckoutService';
import {
    fetchOrderById,
    processOrderTransaction,
} from '@/data/checkout/repositories/CheckoutOrderRepository';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { calculateTotals, createPaymentIntentAction } from '@/data/checkout/CheckoutUtils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { ProcessCheckoutParams } from '@/data/checkout/CheckoutTypes';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutOrderRepository');
jest.mock('@/data/checkout/CheckoutUtils');

describe('CheckoutService', () => {
    let mockSupabase: SupabaseClient<Database>;

    const mockCheckoutParams: ProcessCheckoutParams = {
        userId: 'user-uuid-123',
        customerEmail: 'user@example.com',
        stripeCustomerId: 'cus_123',
        items: [{ bookId: 'book-1', quantity: 2 }],
        discountId: null,
        paymentMethod: 'card',
        idempotencyKey: 'idemp-key-999',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn(),
        } as unknown as SupabaseClient<Database>;

        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(withRetry).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized error',
        );
        jest.mocked(calculateTotals).mockReturnValue({
            subtotal: 40.0,
            discountAmount: 0,
            shippingCost: 5.99,
            taxAmount: 0,
            grandTotal: 45.99,
        });
        jest.mocked(createPaymentIntentAction).mockResolvedValue({
            success: true,
            clientSecret: 'seti_secret_123',
            paymentIntentId: 'pi_test_123',
            error: null,
        });
    });

    describe('executeCheckoutOrder', () => {
        it('should successfully execute checkout order flow without discount', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            jest.mocked(processOrderTransaction).mockResolvedValue({
                data: { order_id: 'order-uuid-888' },
                error: null,
            } as never);

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                success: true,
                orderId: 'order-uuid-888',
                clientSecret: 'seti_secret_123',
                paymentIntentId: 'pi_test_123',
                error: null,
            });
            expect(createPaymentIntentAction).toHaveBeenCalledWith(
                4599,
                'idemp-key-999',
                'GBP',
                {
                    userId: 'user-uuid-123',
                    customerEmail: 'user@example.com',
                },
                'cus_123',
            );
        });

        it('should successfully execute checkout order flow with a valid active percentage discount', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            const mockDiscount = {
                id: 'disc-1',
                code: 'SAVE10',
                value: 10,
                type: 'percentage',
                is_active: true,
                minimum_subtotal: 20,
            };

            (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                        }),
                    };
                }
                if (table === 'discounts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest
                                    .fn()
                                    .mockResolvedValue({ data: mockDiscount, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            jest.mocked(processOrderTransaction).mockResolvedValue({
                data: { order_id: 'order-uuid-888' },
                error: null,
            } as never);

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                discountId: 'disc-1',
            });

            expect(result.error).toBeNull();
            expect(result.data?.orderId).toBe('order-uuid-888');
        });

        it('should successfully execute checkout order flow with a fixed_amount discount having null minimum_subtotal', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            const mockDiscount = {
                id: 'disc-fixed',
                code: 'FIXED5',
                value: 5,
                type: 'fixed_amount',
                is_active: true,
                minimum_subtotal: null,
            };

            (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                        }),
                    };
                }
                if (table === 'discounts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest
                                    .fn()
                                    .mockResolvedValue({ data: mockDiscount, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            jest.mocked(processOrderTransaction).mockResolvedValue({
                data: { order_id: 'order-uuid-999' },
                error: null,
            } as never);

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                discountId: 'disc-fixed',
            });

            expect(result.error).toBeNull();
            expect(result.data?.orderId).toBe('order-uuid-999');
        });

        it('should return error when discount minimum subtotal requirement is not met', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            const mockDiscount = {
                id: 'disc-1',
                code: 'SAVE10',
                value: 10,
                type: 'percentage',
                is_active: true,
                minimum_subtotal: 100,
            };

            (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                        }),
                    };
                }
                if (table === 'discounts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest
                                    .fn()
                                    .mockResolvedValue({ data: mockDiscount, error: null }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                discountId: 'disc-1',
            });

            expect(result.data).toBeNull();
            expect(result.error).toBe('This discount requires a minimum subtotal of $100.00.');
        });

        it('should return sanitized error when discount query fails with database error', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
                if (table === 'books') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                        }),
                    };
                }
                if (table === 'discounts') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: { message: 'Discount DB Error' },
                                }),
                            }),
                        }),
                    };
                }
                return {};
            });

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                discountId: 'disc-1',
            });

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
        });

        it('should return EMPTY_CART_CHECKOUT when items array is empty', async () => {
            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                items: [],
            });

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT);
        });

        it('should return sanitized error if books query returns database error', async () => {
            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
                }),
            });

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
        });

        it('should return INSUFFICIENT_STOCK if returned books count does not match requested items count', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                items: [
                    { bookId: 'book-1', quantity: 1 },
                    { bookId: 'book-2', quantity: 1 },
                ],
            });

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.INSUFFICIENT_STOCK);
        });

        it('should return INSUFFICIENT_STOCK if a book ID is missing from returned books despite matching array length', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
                { id: 'book-3', title: 'Book 3', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            const result = await executeCheckoutOrder({
                ...mockCheckoutParams,
                items: [
                    { bookId: 'book-1', quantity: 1 },
                    { bookId: 'book-2', quantity: 1 },
                ],
            });

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.INSUFFICIENT_STOCK);
        });

        it('should return INSUFFICIENT_STOCK if a book is not active', async () => {
            const mockInactiveBook = [
                {
                    id: 'book-1',
                    title: 'Book 1',
                    price: 20.0,
                    stock_quantity: 10,
                    is_active: false,
                },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockInactiveBook, error: null }),
                }),
            });

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.INSUFFICIENT_STOCK);
        });

        it('should return INSUFFICIENT_STOCK if stock quantity is less than requested', async () => {
            const mockLowStockBook = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 1, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockLowStockBook, error: null }),
                }),
            });

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.INSUFFICIENT_STOCK);
        });

        it('should return PAYMENT_PROCESSING_FAILED if createPaymentIntentAction fails with explicit error', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            jest.mocked(createPaymentIntentAction).mockResolvedValueOnce({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Card declined',
            });

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Card declined');
        });

        it('should fallback to PAYMENT_PROCESSING_FAILED if createPaymentIntentAction fails without an explicit error message', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            jest.mocked(createPaymentIntentAction).mockResolvedValueOnce({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: null,
            });

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED);
        });

        it('should return ORDER_CREATION_FAILED if order RPC transaction returns null data and null error', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            jest.mocked(processOrderTransaction).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.ORDER_CREATION_FAILED);
        });

        it('should return sanitized error when order RPC transaction returns a database error', async () => {
            const mockBooks = [
                { id: 'book-1', title: 'Book 1', price: 20.0, stock_quantity: 10, is_active: true },
            ];

            (mockSupabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockBooks, error: null }),
                }),
            });

            const rpcError = { message: 'RPC database failure' };
            jest.mocked(processOrderTransaction).mockResolvedValue({
                data: null,
                error: rpcError,
            } as never);

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(rpcError);
        });

        it('should handle thrown exception in executeCheckoutOrder and return sanitized error', async () => {
            const error = new Error('Unexpected client creation failure');
            jest.mocked(createBackendClient).mockRejectedValueOnce(error);

            const result = await executeCheckoutOrder(mockCheckoutParams);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(error);
        });
    });

    describe('getOrderDetailsById', () => {
        it('should return order details on successful query', async () => {
            const mockOrderDetails = {
                id: 'order-123',
                total_amount: 45.99,
                status: 'paid',
            };

            jest.mocked(fetchOrderById).mockResolvedValue({
                data: mockOrderDetails,
                error: null,
            } as never);

            const result = await getOrderDetailsById('order-123');

            expect(result.error).toBeNull();
            expect(result.data).toEqual(mockOrderDetails);
            expect(fetchOrderById).toHaveBeenCalledWith(mockSupabase, 'order-123');
        });

        it('should return ORDER_NOT_FOUND when query returns empty data', async () => {
            jest.mocked(fetchOrderById).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            const result = await getOrderDetailsById('non-existent-order');

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.ORDER_NOT_FOUND);
        });

        it('should return sanitized error when fetchOrderById returns database error', async () => {
            const dbError = { message: 'Database query failed' };
            jest.mocked(fetchOrderById).mockResolvedValue({
                data: null,
                error: dbError,
            } as never);

            const result = await getOrderDetailsById('order-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
        });

        it('should handle thrown exception in getOrderDetailsById and return sanitized error', async () => {
            const error = new Error('Unexpected client creation failure');
            jest.mocked(createBackendClient).mockRejectedValueOnce(error);

            const result = await getOrderDetailsById('order-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(error);
        });
    });
});
