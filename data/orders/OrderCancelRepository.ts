import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/database.types';

export const cancelOrderRpc = async (
    supabase: SupabaseClient<Database>,
    orderId: string,
    userId: string,
) => {
    return supabase.rpc('cancel_user_order', {
        p_order_id: orderId,
        p_user_id: userId,
    });
};
