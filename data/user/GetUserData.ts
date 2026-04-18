'use server';

import { createBackendClient } from '@/utils/db/server';
import { findUserById, findWishlistByUserId } from './UserRepository';
import { withRetry } from '@/utils/network/retry';

export const getUserData = async (): Promise<ActionResponse<User>> => {
    try {
        const supabase = await createBackendClient();

        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) return { data: null, error: 'User session not found.' };

        const result = await withRetry(async () => {
            return await findUserById(supabase, authUser.id);
        });

        if (result.error) {
            console.error('[UserService] Profile Fetch Error:', result.error.message);
            return { data: null, error: 'Failed to retrieve profile data.' };
        }

        if (!result.data) return { data: null, error: null };

        return {
            data: {
                ...result.data,
                email: authUser.email || '',
            } as User,
            error: null,
        };
    } catch (err) {
        console.error('[UserService] Unexpected Error:', err);
        return { data: null, error: 'A system error occurred or connection timed out.' };
    }
};

export const getUserWishlist = async (userID: string): Promise<ActionResponse<Wishlist[]>> => {
    if (!userID) return { data: null, error: 'No user ID provided.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();
            return await findWishlistByUserId(supabase, userID);
        });

        if (result.error) {
            console.error('[UserService] Wishlist Fetch Error:', result.error.message);
            return { data: null, error: 'Could not load wishlist.' };
        }

        return {
            data: (result.data || []) as Wishlist[],
            error: null,
        };
    } catch (err) {
        console.error('[UserService] Wishlist System Error:', err);
        return { data: null, error: 'Failed to fetch wishlist due to network issues.' };
    }
};
