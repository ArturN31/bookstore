'use client';

import { useEffect } from 'react';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface UseUserListenersProps {
    supabase: SupabaseClient;
    activeUserId: string | null;
    router: AppRouterInstance;
    syncAllData: (user: SupabaseUser | null) => Promise<void>;
    refreshProfile: () => Promise<void>;
    reset: () => void;
}

export const useUserListeners = ({
    supabase,
    activeUserId,
    router,
    syncAllData,
    refreshProfile,
    reset,
}: UseUserListenersProps) => {
    useEffect(() => {
        const hydrate = async () => {
            if (!activeUserId) {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) await syncAllData(user);
            }
        };
        hydrate();
    }, []);

    // Auth State Listener (Login/Logout/Updates)
    useEffect(() => {
        const {
            data: { subscription: authListener },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                await syncAllData(currentUser);
            } else if (event === 'SIGNED_OUT') {
                reset();
                router.push('/');
                router.refresh();
            }
        });

        return () => authListener.unsubscribe();
    }, [supabase, syncAllData, router, reset]);

    // Realtime Postgres Listener (Database table updates)
    useEffect(() => {
        if (!activeUserId) return;

        const channel = supabase
            .channel(`user_changes_${activeUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${activeUserId}`,
                },
                () => refreshProfile(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeUserId, supabase, refreshProfile]);
};
