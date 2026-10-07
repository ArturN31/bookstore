import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { fetchFullCartWithBooks } from '@/data/checkout/repositories/CheckoutCartRepository';

describe('CheckoutCartRepository', () => {
    describe('fetchFullCartWithBooks', () => {
        it('should execute the query with correct filters and ordering', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: {
                    id: 'cart-123',
                    shopping_cart_items: [
                        {
                            id: 'item-1',
                            quantity: 2,
                            created_at: '2026-01-01T00:00:00Z',
                            books: { id: 'book-1', title: 'Test Book', price: 19.99 },
                        },
                    ],
                },
                error: null,
            });

            const mockOrder = jest.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
            });

            const mockEq = jest.fn().mockReturnValue({
                order: mockOrder,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const userId = 'user-123';
            const result = await fetchFullCartWithBooks(mockSupabase, userId);

            expect(mockFrom).toHaveBeenCalledWith('shopping_carts');
            expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('shopping_cart_items'));
            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
            expect(mockOrder).toHaveBeenCalledWith('created_at', {
                referencedTable: 'shopping_cart_items',
                ascending: true,
            });
            expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                data: {
                    id: 'cart-123',
                    shopping_cart_items: [
                        {
                            id: 'item-1',
                            quantity: 2,
                            created_at: '2026-01-01T00:00:00Z',
                            books: { id: 'book-1', title: 'Test Book', price: 19.99 },
                        },
                    ],
                },
                error: null,
            });
        });
    });
});
