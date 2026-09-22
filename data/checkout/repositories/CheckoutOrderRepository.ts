import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/database.types';

export interface ProcessOrderPayloadItem {
    book_id: string;
    quantity: number;
    price: number;
}

export interface ProcessOrderPayload {
    user_id: string;
    total_amount: number;
    payment_method: string;
    discount_id: string | null;
    items: ProcessOrderPayloadItem[];
}

export const processOrderTransaction = async (
    supabase: SupabaseClient<Database>,
    payload: ProcessOrderPayload,
) => {
    return supabase.rpc('process_order_transaction', {
        p_payload: payload as unknown as Json,
    });
};

export const fetchOrderById = async (supabase: SupabaseClient<Database>, orderId: string) => {
    return supabase
        .from('orders')
        .select(
            `
            *,
            order_items (
                id,
                quantity,
                price,
                books (*)
            ),
            order_discounts (
                discounts (*)
            )
        `,
        )
        .eq('id', orderId)
        .maybeSingle();
};
