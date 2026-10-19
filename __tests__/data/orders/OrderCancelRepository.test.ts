import { cancelOrderRpc } from '@/data/orders/OrderCancelRepository';
import { SupabaseClient } from '@supabase/supabase-js';

describe('OrderCancelRepository', () => {
    it('calls supabase rpc with cancel_user_order and correct parameters', async () => {
        const mockRpc = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
        const mockSupabase = {
            rpc: mockRpc,
        } as unknown as SupabaseClient;

        const orderId = '123e4567-e89b-12d3-a456-426614174000';
        const userId = 'user-456';

        await cancelOrderRpc(mockSupabase, orderId, userId);

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('cancel_user_order', {
            p_order_id: orderId,
            p_user_id: userId,
        });
    });
});
