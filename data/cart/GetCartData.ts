'use server';

import { createBackendClient } from '@/utils/db/server';
import { PostgrestError } from '@supabase/supabase-js';
import * as Repo from './CartRepository';
import { mapDatabaseCartToDomain } from './CartMapper';
import { withRetry } from '@/utils/network/retry';
import { revalidateTag } from 'next/cache';

const handleDatabaseError = (error: PostgrestError, context: string): ActionResponse<never> => {
    console.error(`[CartService] ${context} failure:`, error.message);
    return {
        data: null,
        error: `Unable to ${context.toLowerCase()} at this time.`,
    };
};

const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const verifyUserSession = async (supabase: any): Promise<string | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
};

export const getUsersCartID = async (userID: string): Promise<ActionResponse<string>> => {
    if (!isValidUUID(userID)) return { data: null, error: 'User session is invalid.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error('Unauthorized access token');

            return await Repo.findCartIdByUserId(supabase, userID);
        });

        if (result.error) return handleDatabaseError(result.error, 'Fetch Cart');
        return { data: result.data?.id || null, error: null };
    } catch (err) {
        return { data: null, error: 'Connection timeout. Please try again.' };
    }
};

export const createUsersCart = async (userID: string): Promise<ActionResponse<string>> => {
    if (!isValidUUID(userID)) return { data: null, error: 'User session is invalid.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error('Unauthorized access token');

            return await Repo.createCart(supabase, userID);
        });

        if (result.error) return handleDatabaseError(result.error, 'Create Cart');
        return { data: result.data.id, error: null };
    } catch (err) {
        return { data: null, error: 'Failed to create cart due to connection issues.' };
    }
};

export const addItemToUsersCart = async (
    cartID: string,
    bookID: string,
    bookQuantity: number,
): Promise<ActionResponse<boolean>> => {
    if (!isValidUUID(cartID) || !isValidUUID(bookID))
        return { data: false, error: 'Malformed identifier parameters.' };
    if (bookQuantity < 1) return { data: false, error: 'Invalid quantity assignment.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error('Unauthenticated user context');

            return await Repo.upsertItem(supabase, cartID, bookID, bookQuantity);
        });

        if (result.error) return handleDatabaseError(result.error, 'Add Item');

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err) {
        return { data: false, error: 'Could not add item. Connection timed out.' };
    }
};

export const updateItemInUsersCart = async (
    cartID: string,
    bookID: string,
    bookQuantity: number,
): Promise<ActionResponse<boolean>> => {
    if (!isValidUUID(cartID) || !isValidUUID(bookID))
        return { data: false, error: 'Malformed identifier parameters.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error('Unauthenticated user context');

            return await Repo.updateItem(supabase, cartID, bookID, bookQuantity);
        });

        if (result.error) return handleDatabaseError(result.error, 'Update Item');

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err) {
        return { data: false, error: 'Update failed due to network error.' };
    }
};

export const removeItemFromUsersCart = async (
    cartID: string,
    bookID: string,
): Promise<ActionResponse<boolean>> => {
    if (!isValidUUID(cartID) || !isValidUUID(bookID))
        return { data: false, error: 'Malformed identifier parameters.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error('Unauthenticated user context');

            return await Repo.deleteItem(supabase, cartID, bookID);
        });

        if (result.error) return handleDatabaseError(result.error, 'Remove Item');

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err) {
        return { data: false, error: 'Removal failed. Check your connection.' };
    }
};

export const getCartData = async (
    userID: string,
): Promise<ActionResponse<{ cartID: string | null; books: CartItem[] }>> => {
    if (!isValidUUID(userID)) return { data: null, error: 'Session identification failed.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error('Unauthorized access token');

            return await Repo.fetchFullCartWithBooks(supabase, userID);
        });

        if (result.error) return handleDatabaseError(result.error, 'Retrieve Cart Content');

        return {
            data: mapDatabaseCartToDomain(result.data),
            error: null,
        };
    } catch (err) {
        console.error('[CartService] Pipeline Error:', err);
        return { data: null, error: 'Internal system error or connection timeout.' };
    }
};
