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
        if (!activeUserId) {
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) syncAllData(data.user);
            });
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED')
                await syncAllData(session?.user ?? null);
            if (event === 'SIGNED_OUT') {
                reset();
                router.push('/');
                router.refresh();
            }
        });

        let channel: any = null;
        if (activeUserId) {
            channel = supabase
                .channel(`user_changes_${activeUserId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${activeUserId}`,
                    },
                    () => {
                        refreshProfile();
                    },
                )
                .subscribe();
        }

        return () => {
            subscription.unsubscribe();
            if (channel) supabase.removeChannel(channel);
        };
    }, [supabase, activeUserId, router, syncAllData, refreshProfile, reset]);
};
