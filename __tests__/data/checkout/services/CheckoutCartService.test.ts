import { getActiveCartCheckoutItems } from '@/data/checkout/services/CheckoutCartService';
import { fetchFullCartWithBooks } from '@/data/checkout/repositories/CheckoutCartRepository';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutCartRepository');

describe('CheckoutCartService', () => {
    const mockSupabase = {} as SupabaseClient<Database>;
    const mockUserId = 'user-uuid-123';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(withRetry).mockImplementation(async (fn) => await fn());
        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized database error',
        );
    });

    describe('getActiveCartCheckoutItems', () => {
        it('should return formatted cart items on successful query', async () => {
            const mockCartData = {
                id: 'cart-123',
                shopping_cart_items: [
                    {
                        id: 'item-1',
                        quantity: 2,
                        created_at: '2026-01-01T00:00:00Z',
                        books: {
                            id: 'book-1',
                            title: 'Clean Architecture',
                            price: 29.99,
                            is_active: true,
                            stock_quantity: 10,
                        },
                    },
                ],
            };

            jest.mocked(fetchFullCartWithBooks).mockResolvedValue({
                data: mockCartData,
                error: null,
            } as never);

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(createBackendClient).toHaveBeenCalledTimes(1);
            expect(fetchFullCartWithBooks).toHaveBeenCalledWith(mockSupabase, mockUserId);
            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0]).toEqual({
                id: 'book-1',
                title: 'Clean Architecture',
                price: 29.99,
                is_active: true,
                stock_quantity: 10,
                quantity: 2,
            });
        });

        it('should return EMPTY_CART_CHECKOUT error when query returns null data', async () => {
            jest.mocked(fetchFullCartWithBooks).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT);
        });

        it('should return sanitized error when fetchFullCartWithBooks returns a database error', async () => {
            jest.mocked(fetchFullCartWithBooks).mockResolvedValue({
                data: null,
                error: { message: 'Database connection timeout' },
            } as never);

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized database error');
            expect(sanitizeSupabaseError).toHaveBeenCalledTimes(1);
        });

        it('should return EMPTY_CART_CHECKOUT when shopping_cart_items array is empty', async () => {
            const emptyCartData = {
                id: 'cart-123',
                shopping_cart_items: [],
            };

            jest.mocked(fetchFullCartWithBooks).mockResolvedValue({
                data: emptyCartData,
                error: null,
            } as never);

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT);
        });

        it('should return EMPTY_CART_CHECKOUT if cart items contain no valid book references', async () => {
            const invalidCartData = {
                id: 'cart-123',
                shopping_cart_items: [
                    {
                        id: 'item-1',
                        quantity: 1,
                        created_at: '2026-01-01T00:00:00Z',
                        books: null,
                    },
                ],
            };

            jest.mocked(fetchFullCartWithBooks).mockResolvedValue({
                data: invalidCartData,
                error: null,
            } as never);

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT);
        });

        it('should handle unexpected thrown exceptions and return sanitized error', async () => {
            jest.mocked(createBackendClient).mockRejectedValueOnce(
                new Error('Unexpected server failure'),
            );

            const result = await getActiveCartCheckoutItems(mockUserId);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized database error');
        });
    });
});
