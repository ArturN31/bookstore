'use client';
import { useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface UseCartListenersProps {
    supabase: SupabaseClient;
    cartID: string | null;
    loggedIn: boolean;
    refreshCart: () => Promise<void>;
    resetCart: () => void;
}

export const useCartListeners = ({
    supabase,
    cartID,
    loggedIn,
    refreshCart,
    resetCart,
}: UseCartListenersProps) => {
    useEffect(() => {
        if (!loggedIn) resetCart();
    }, [loggedIn, resetCart]);

    // Postgres Realtime listener
    useEffect(() => {
        if (!loggedIn || !cartID) return;

        const channel = supabase
            .channel(`cart-sync-${cartID}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shopping_cart_items',
                    filter: `cart_id=eq.${cartID}`,
                },
                () => refreshCart(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loggedIn, cartID, supabase, refreshCart]);
};
