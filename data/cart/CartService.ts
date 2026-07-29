'use server';

import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import * as Repo from './CartRepository';
import { mapDatabaseCartToDomain, CartItem } from './CartMapper';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { revalidateTag } from 'next/cache';

interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const verifyUserSession = async (supabase: SupabaseClient<Database>): Promise<string | null> => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
};

export const getUsersCartID = async (userID: string): Promise<ActionResponse<string | null>> => {
    if (!isValidUUID(userID)) return { data: null, error: 'User session is invalid.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error('Unauthorized access token');

            return await safeSupabaseQuery(
                async () => await Repo.findCartIdByUserId(supabase, userID),
            );
        });

        if (result.error) {
            if (result.error === 'No data returned.') return { data: null, error: null };
            return { data: null, error: sanitizeSupabaseError(result.error) };
        }

        return { data: result.data?.id || null, error: null };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const createUsersCart = async (userID: string): Promise<ActionResponse<string>> => {
    if (!isValidUUID(userID)) return { data: null, error: 'User session is invalid.' };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error('Unauthorized access token');

            return await safeSupabaseQuery(async () => await Repo.createCart(supabase, userID));
        });

        if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
        if (!result.data) return { data: null, error: 'Failed to create cart.' };
        return { data: result.data.id, error: null };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
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

            return await safeSupabaseQuery(
                async () => await Repo.upsertItem(supabase, cartID, bookID, bookQuantity),
            );
        });

        if (result.error) return { data: false, error: sanitizeSupabaseError(result.error) };

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err: unknown) {
        return { data: false, error: sanitizeSupabaseError(err) };
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

            return await safeSupabaseQuery(
                async () => await Repo.updateItem(supabase, cartID, bookID, bookQuantity),
            );
        });

        if (result.error) return { data: false, error: sanitizeSupabaseError(result.error) };

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err: unknown) {
        return { data: false, error: sanitizeSupabaseError(err) };
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

            return await safeSupabaseQuery(
                async () => await Repo.deleteItem(supabase, cartID, bookID),
            );
        });

        if (result.error) return { data: false, error: sanitizeSupabaseError(result.error) };

        revalidateTag(`cart_${cartID}`, 'max');
        return { data: true, error: null };
    } catch (err: unknown) {
        return { data: false, error: sanitizeSupabaseError(err) };
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

            return await safeSupabaseQuery(
                async () => await Repo.fetchFullCartWithBooks(supabase, userID),
            );
        });

        if (result.error) {
            if (result.error === 'No data returned.')
                return {
                    data: { cartID: null, books: [] },
                    error: null,
                };
            return { data: null, error: sanitizeSupabaseError(result.error) };
        }

        return {
            data: mapDatabaseCartToDomain(result.data),
            error: null,
        };
    } catch (err: unknown) {
        console.error('[CartService] Pipeline Error:', err);
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};
