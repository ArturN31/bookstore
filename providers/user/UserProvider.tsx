'use client';
import React, { useReducer, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createFrontendClient } from '@/utils/db/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserStateContext, UserActionsContext } from '@/providers/user/UserContext';
import { userReducer } from '@/providers/user/UserReducer';
import { createInitialState } from '@/providers/user/utils/UserMapper';
import { useUserListeners } from '@/providers/user/utils/useUserListeners';
import { getUserData, getUserWishlist } from '@/data/user/GetUserData';

interface UserProviderProps {
    initialUser: User | null;
    initialWishlist: Wishlist[] | null;
    children: React.ReactNode;
}

export const UserProvider = ({ initialUser, initialWishlist, children }: UserProviderProps) => {
    const [state, dispatch] = useReducer(
        userReducer,
        createInitialState(initialUser, initialWishlist),
    );

    const supabase = useMemo(() => createFrontendClient(), []);
    const router = useRouter();

    const activeUserId = useRef<string | null>(initialUser?.id || null);

    const syncAllData = useCallback(
        async (supabaseUser: SupabaseUser | null) => {
            const userId = supabaseUser?.id || null;
            activeUserId.current = userId;

            if (!userId) {
                dispatch({ type: 'RESET' });
                return;
            }

            try {
                dispatch({ type: 'START_LOADING' });

                const [userData, wishlistData] = await Promise.all([
                    getUserData(),
                    getUserWishlist(userId),
                ]);

                if (activeUserId.current === userId) {
                    dispatch({
                        type: 'SET_SYNCED_DATA',
                        payload: {
                            user: userData || ({ id: userId } as any),
                            profileExists: !!userData,
                            wishlist: wishlistData ?? [],
                        },
                    });
                }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: 'Sync failed' });
            } finally {
                if (activeUserId.current === userId) dispatch({ type: 'STOP_LOADING' });
            }
        },
        [supabase],
    );

    const refreshProfile = useCallback(async () => {
        if (!activeUserId.current) return;

        try {
            const userData = await getUserData();

            dispatch({
                type: 'UPDATE_PROFILE',
                payload: {
                    user: userData || ({ id: activeUserId.current } as User),
                    profileExists: !!userData,
                },
            });
        } catch (err) {
            console.error('Profile refresh failed:', err);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Could not update profile data.',
            });
        }
    }, [supabase]);

    const refreshWishlist = useCallback(async () => {
        if (!activeUserId.current) return;

        try {
            const wishlistData = await getUserWishlist(activeUserId.current);
            dispatch({ type: 'UPDATE_WISHLIST', payload: wishlistData ?? [] });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: 'Could not update wishlist.' });
        }
    }, [supabase]);

    useUserListeners({
        supabase,
        activeUserId: state.user.id,
        router,
        syncAllData,
        refreshProfile,
        reset: () => dispatch({ type: 'RESET' }),
    });

    const actions = useMemo(
        () => ({
            refreshProfile,
            refreshWishlist,
            signOut: async () => {
                activeUserId.current = null;
                await supabase.auth.signOut();
            },
        }),
        [refreshProfile, refreshWishlist, supabase],
    );

    return (
        <UserActionsContext.Provider value={actions}>
            <UserStateContext.Provider value={state}>{children}</UserStateContext.Provider>
        </UserActionsContext.Provider>
    );
};
