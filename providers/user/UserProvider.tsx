'use client';
import React, { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createFrontendClient } from '@/utils/db/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
    UserStateContext,
    UserActionsContext,
    PartialUserPayload,
} from '@/providers/user/UserContext';
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
    const activeUserId = useRef<string | null>(state.user.id || null);

    useEffect(() => {
        activeUserId.current = state.user.id || null;
    }, [state.user.id]);

    const syncAllData = useCallback(
        async (supabaseUser: SupabaseUser | null) => {
            dispatch({ type: 'START_SYNC' });

            try {
                if (!supabaseUser) {
                    dispatch({ type: 'RESET' });
                    return;
                }

                const [userData, wishlistData] = await Promise.all([
                    getUserData(),
                    getUserWishlist(supabaseUser.id),
                ]);

                const syncError = userData.error || wishlistData.error;
                if (syncError) {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: syncError,
                    });
                    return;
                }

                const userPayload: PartialUserPayload = userData.data
                    ? userData.data
                    : { id: supabaseUser.id };

                dispatch({
                    type: 'SET_SYNCED_DATA',
                    payload: {
                        user: userPayload,
                        profileExists: !!userData.data,
                        wishlist: wishlistData.data || [],
                    },
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unexpected error occurred';
                dispatch({ type: 'SET_ERROR', payload: message });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getUserData, getUserWishlist],
    );

    const refreshProfile = useCallback(async () => {
        const userId = activeUserId.current;
        if (!userId) return;

        try {
            const { data, error } = await getUserData();
            if (error) throw new Error(error);

            if (activeUserId.current === userId) {
                dispatch({
                    type: 'UPDATE_PROFILE',
                    payload: {
                        user: data || ({ id: userId } as User),
                        profileExists: !!data,
                    },
                });
            }
        } catch (err) {
            console.error('Profile update failed:', err);
            dispatch({ type: 'SET_ERROR', payload: 'Profile update failed' });
        }
    }, []);

    const refreshWishlist = useCallback(async () => {
        const userId = activeUserId.current;
        if (!userId) return;

        try {
            const { data, error } = await getUserWishlist(userId);
            if (error) throw new Error(error);
            if (activeUserId.current === userId)
                dispatch({ type: 'UPDATE_WISHLIST', payload: data ?? [] });
        } catch (err) {
            console.error('Wishlist update failed:', err);
            dispatch({ type: 'SET_ERROR', payload: 'Wishlist update failed' });
        }
    }, []);

    const signOut = useCallback(async () => {
        activeUserId.current = null;
        dispatch({ type: 'RESET' });
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    }, [supabase, router]);

    useUserListeners({
        supabase,
        activeUserId: state.user.id || null,
        router,
        syncAllData,
        refreshProfile,
        reset: () => dispatch({ type: 'RESET' }),
    });

    const actions = useMemo(
        () => ({
            refreshProfile,
            refreshWishlist,
            signOut,
        }),
        [refreshProfile, refreshWishlist, signOut],
    );

    return (
        <UserActionsContext.Provider value={actions}>
            <UserStateContext.Provider value={state}>{children}</UserStateContext.Provider>
        </UserActionsContext.Provider>
    );
};
