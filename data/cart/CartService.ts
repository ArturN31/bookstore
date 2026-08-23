'use server';

import * as Repo from './CartRepository';
import { mapDatabaseCartToDomain, CartItem } from './CartMapper';
import { CART_OPERATION_TYPES, CART_SUCCESS_MESSAGES } from './CartConstants';
import { SafeQueryResult } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { executeCartAction, handleItemMutation, isValidUUID } from './CartServiceUtils';

export interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

type CartIdResult = NonNullable<Awaited<ReturnType<typeof Repo.findCartIdByUserId>>['data']>;
type CreateCartResult = NonNullable<Awaited<ReturnType<typeof Repo.createCart>>['data']>;
type FullCartResult = NonNullable<Awaited<ReturnType<typeof Repo.fetchFullCartWithBooks>>['data']>;

export const getUsersCartID = async (userID: string): Promise<ActionResponse<string | null>> => {
    const result = await executeCartAction<CartIdResult>('getUsersCartID', userID, (supabase) =>
        Repo.findCartIdByUserId(supabase, userID),
    );
    if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED) return { data: null, error: null };
    return { data: result.data?.id || null, error: result.error };
};

export const createUsersCart = async (userID: string): Promise<ActionResponse<string>> => {
    const result = await executeCartAction<CreateCartResult>(
        'createUsersCart',
        userID,
        (supabase) => Repo.createCart(supabase, userID),
    );
    if (!result.error && !result.data)
        return { data: null, error: APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART };
    return { data: result.data?.id || null, error: result.error };
};

export const addItemToUsersCart = async (
    cartID: string,
    bookID: string,
    bookQuantity: number,
): Promise<ActionResponse<boolean>> => {
    if (bookQuantity < 1) return { data: false, error: APP_ERROR_MESSAGES.INVALID_QUANTITY };
    return handleItemMutation('addItemToUsersCart', cartID, bookID, async (supabase) => {
        const { error } = await Repo.upsertItem(supabase, cartID, bookID, bookQuantity);
        return { data: error ? null : true, error };
    });
};

export const updateItemInUsersCart = async (
    cartID: string,
    bookID: string,
    bookQuantity: number,
): Promise<ActionResponse<boolean>> => {
    if (bookQuantity < 1) return { data: false, error: APP_ERROR_MESSAGES.INVALID_QUANTITY };
    return handleItemMutation('updateItemInUsersCart', cartID, bookID, async (supabase) => {
        const { error } = await Repo.updateItem(supabase, cartID, bookID, bookQuantity);
        return { data: error ? null : true, error };
    });
};

export const removeItemFromUsersCart = async (
    cartID: string,
    bookID: string,
): Promise<ActionResponse<boolean>> => {
    return handleItemMutation('removeItemFromUsersCart', cartID, bookID, async (supabase) => {
        const { error } = await Repo.deleteItem(supabase, cartID, bookID);
        return { data: error ? null : true, error };
    });
};

export const clearUsersCart = async (cartID: string): Promise<ActionResponse<boolean>> => {
    if (!isValidUUID(cartID))
        return { data: false, error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER };

    const result = await executeCartAction<boolean>(
        'clearUsersCart',
        null,
        async (supabase) => {
            const { error } = await Repo.clearCartItems(supabase, cartID);
            return { data: error ? null : true, error };
        },
        false,
    );

    if (result.error) return { data: false, error: result.error };
    return { data: result.data, error: null };
};

export const getCartData = async (
    userID: string,
): Promise<ActionResponse<{ cartID: string | null; books: CartItem[] }>> => {
    const result = await executeCartAction<FullCartResult>('getCartData', userID, (supabase) =>
        Repo.fetchFullCartWithBooks(supabase, userID),
    );
    if (result.error === APP_ERROR_MESSAGES.NO_DATA_RETURNED)
        return { data: { cartID: null, books: [] }, error: null };
    if (result.error) return { data: null, error: result.error };
    return { data: mapDatabaseCartToDomain(result.data), error: null };
};

export const ensureCartExists = async (userId: string): Promise<SafeQueryResult<string>> => {
    try {
        const lookup = await getUsersCartID(userId);
        if (lookup.error) return { data: null, error: sanitizeSupabaseError(lookup.error) };
        if (lookup.data) return { data: lookup.data, error: null };

        const created = await createUsersCart(userId);
        if (created.error || !created.data)
            return {
                data: null,
                error: sanitizeSupabaseError(
                    created.error || APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART,
                ),
            };
        return { data: created.data, error: null };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};

type CartOperationFunction = (
    cartId: string,
    bookId: string,
    quantity: number,
) => Promise<ActionResponse<boolean>>;

const getCartOperation = (type: string): CartOperationFunction | null => {
    switch (type) {
        case CART_OPERATION_TYPES.INSERT:
            return addItemToUsersCart;
        case CART_OPERATION_TYPES.UPDATE:
            return updateItemInUsersCart;
        case CART_OPERATION_TYPES.REMOVE:
            return (cartId: string, bookId: string) => removeItemFromUsersCart(cartId, bookId);
        default:
            return null;
    }
};

export const executeCartOperation = async (
    type: string,
    cartId: string,
    bookId: string,
    quantity: number,
): Promise<SafeQueryResult<boolean> & { message?: string }> => {
    const operation = getCartOperation(type);
    if (!operation) return { data: null, error: APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE };

    try {
        const result = await operation(cartId, bookId, quantity);

        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };

        return {
            data: result.data as boolean,
            error: null,
            message:
                CART_SUCCESS_MESSAGES[type as keyof typeof CART_SUCCESS_MESSAGES] ||
                CART_SUCCESS_MESSAGES.DEFAULT,
        };
    } catch (err: unknown) {
        return { data: null, error: sanitizeSupabaseError(err) };
    }
};
