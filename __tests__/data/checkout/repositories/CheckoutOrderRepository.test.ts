import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/database.types';
import {
    processOrderTransaction,
    fetchOrderById,
} from '@/data/checkout/repositories/CheckoutOrderRepository';
import { ProcessOrderPayload } from '@/data/checkout/CheckoutTypes';

describe('CheckoutOrderRepository', () => {
    describe('processOrderTransaction', () => {
        it('should invoke process_order_transaction RPC with formatted payload', async () => {
            const mockRpc = jest.fn().mockResolvedValue({
                data: { order_id: 'order-999' },
                error: null,
            });

            const mockSupabase = {
                rpc: mockRpc,
            } as unknown as SupabaseClient<Database>;

            const payload: ProcessOrderPayload = {
                user_id: 'user-123',
                total_amount: 49.99,
                payment_method: 'card',
                discount_id: 'disc-123',
                items: [
                    {
                        book_id: 'book-1',
                        quantity: 1,
                        price: 49.99,
                    },
                ],
                payment_intent_id: 'intent-123',
            };

            const result = await processOrderTransaction(mockSupabase, payload);

            expect(mockRpc).toHaveBeenCalledWith('process_order_transaction', {
                p_payload: payload as unknown as Json,
            });
            expect(result).toEqual({ data: { order_id: 'order-999' }, error: null });
        });
    });

    describe('fetchOrderById', () => {
        it('should fetch order by ID with line items and discounts', async () => {
            const mockOrderData = {
                id: 'order-999',
                user_id: 'user-123',
                total_amount: 49.99,
                order_items: [],
                order_discounts: [],
            };

            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: mockOrderData,
                error: null,
            });

            const mockEq = jest.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
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

            const result = await fetchOrderById(mockSupabase, 'order-999');

            expect(mockFrom).toHaveBeenCalledWith('orders');
            expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('order_items'));
            expect(mockEq).toHaveBeenCalledWith('id', 'order-999');
            expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: mockOrderData, error: null });
        });
    });
});
