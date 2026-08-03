'use server';

import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import * as Repo from './CartRepository';
import { mapDatabaseCartToDomain, CartItem } from './CartMapper';
import { CART_SUCCESS_MESSAGES, CART_OPERATION_TYPES } from './CartConstants';
import { withRetry } from '@/utils/network/retry';
import { safeSupabaseQuery, SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError, APP_ERROR_MESSAGES } from '@/utils/errors/SupabaseErrorHandler';
import { revalidateTag } from 'next/cache';

export interface ActionResponse<T> {
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
    if (!isValidUUID(userID)) return { data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(
                async () => await Repo.findCartIdByUserId(supabase, userID),
            );
        });

        if (result.error) {
            if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
                return { data: null, error: null };
            return { data: null, error: sanitizeSupabaseError(result.error) };
        }

        return { data: result.data?.id || null, error: null };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

export const createUsersCart = async (userID: string): Promise<ActionResponse<string>> => {
    if (!isValidUUID(userID)) return { data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(async () => await Repo.createCart(supabase, userID));
        });

        if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
        if (!result.data) return { data: null, error: APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART };
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
        return { data: false, error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER };
    if (bookQuantity < 1) return { data: false, error: APP_ERROR_MESSAGES.INVALID_QUANTITY };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error(APP_ERROR_MESSAGES.UNAUTHENTICATED_USER);

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
        return { data: false, error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error(APP_ERROR_MESSAGES.UNAUTHENTICATED_USER);

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
        return { data: false, error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (!authenticatedId) throw new Error(APP_ERROR_MESSAGES.UNAUTHENTICATED_USER);

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
    if (!isValidUUID(userID))
        return { data: null, error: APP_ERROR_MESSAGES.SESSION_IDENTIFICATION_FAILED };

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();

            const authenticatedId = await verifyUserSession(supabase);
            if (authenticatedId !== userID) throw new Error(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);

            return await safeSupabaseQuery(
                async () => await Repo.fetchFullCartWithBooks(supabase, userID),
            );
        });

        if (result.error) {
            if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
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

export const ensureCartExists = async (userId: string): Promise<SafeQueryResult<string>> => {
    try {
        const lookup = await getUsersCartID(userId);
        if (lookup.error)
            return {
                data: null,
                error: sanitizeSupabaseError(lookup.error),
            };
        if (lookup.data) return { data: lookup.data, error: null };

        const created = await createUsersCart(userId);
        if (created.error)
            return {
                data: null,
                error: sanitizeSupabaseError(created.error),
            };
        if (!created.data)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART,
            };
        return { data: created.data, error: null };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};

export const buildCartOperationResult = async (
    result: ActionResponse<boolean>,
): Promise<SafeQueryResult<boolean>> => {
    if (result.error) return { data: null, error: sanitizeSupabaseError(result.error) };
    return { data: result.data ?? true, error: null };
};

const CART_OPERATIONS: Record<
    string,
    (cartId: string, bookId: string, qty: number) => Promise<SafeQueryResult<boolean>>
> = {
    [CART_OPERATION_TYPES.INSERT]: async (cartId, bookId, qty) => {
        const result = await addItemToUsersCart(cartId, bookId, qty);
        return buildCartOperationResult(result);
    },
    [CART_OPERATION_TYPES.UPDATE]: async (cartId, bookId, qty) => {
        const result = await updateItemInUsersCart(cartId, bookId, qty);
        return buildCartOperationResult(result);
    },
    [CART_OPERATION_TYPES.REMOVE]: async (cartId, bookId) => {
        const result = await removeItemFromUsersCart(cartId, bookId);
        return buildCartOperationResult(result);
    },
};

export const executeCartOperation = async (
    type: string,
    cartId: string,
    bookId: string,
    quantity: number,
): Promise<SafeQueryResult<boolean> & { message?: string }> => {
    const operation = CART_OPERATIONS[type];

    if (!operation) return { data: null, error: APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE };

    try {
        const result = await operation(cartId, bookId, quantity);
        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };
        return {
            ...result,
            message:
                CART_SUCCESS_MESSAGES[type as keyof typeof CART_SUCCESS_MESSAGES] ||
                CART_SUCCESS_MESSAGES.DEFAULT,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
