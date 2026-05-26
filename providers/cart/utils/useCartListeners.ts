import { useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface UseCartListenersProps {
    supabase: SupabaseClient;
    cartID: string | null;
    onCartChange: () => void;
}

export const useCartListeners = ({ supabase, cartID, onCartChange }: UseCartListenersProps) => {
    useEffect(() => {
        if (!cartID) return;

        const channelName = `cart-sync-${cartID}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shopping_cart_items',
                    filter: `cart_id=eq.${cartID}`,
                },
                () => {
                    onCartChange();
                },
            )
            .subscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [supabase, cartID, onCartChange]);
};
