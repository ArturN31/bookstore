import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/GetCartData';

export const ensureCartExists = async (userId: string): Promise<ActionResponse<string>> => {
    const lookup = await getUsersCartID(userId);
    if (lookup.error) return lookup;
    if (lookup.data) return { data: lookup.data, error: null };

    return createUsersCart(userId);
};

const SUCCESS_MESSAGES: Record<string, string> = {
    INSERT: 'Item added to your cart!',
    UPDATE: 'Cart quantity updated.',
    REMOVE: 'Item removed from your cart.',
};

const CART_OPERATIONS: Record<
    string,
    (cartId: string, bookId: string, qty: number) => Promise<ActionResponse<boolean>>
> = {
    INSERT: addItemToUsersCart,
    UPDATE: updateItemInUsersCart,
    REMOVE: (cartId, bookId) => removeItemFromUsersCart(cartId, bookId),
};

export const executeCartOperation = async (
    type: string,
    cartId: string,
    bookId: string,
    quantity: number,
): Promise<ActionResponse<boolean> & { message?: string }> => {
    const operation = CART_OPERATIONS[type];

    if (!operation) return { data: null, error: 'Unsupported action type.' };

    const result = await operation(cartId, bookId, quantity);

    if (result.error) return result;

    return {
        ...result,
        message: SUCCESS_MESSAGES[type] || 'Cart updated successfully.',
    };
};
