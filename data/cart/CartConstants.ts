export const CART_SUCCESS_MESSAGES = {
    INSERT: 'Item added to your cart!',
    UPDATE: 'Cart quantity updated.',
    REMOVE: 'Item removed from your cart.',
    CLEAR: 'Cart cleared successfully.',
    DEFAULT: 'Cart updated successfully.',
} as const;

export const CART_OPERATION_TYPES = {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    REMOVE: 'REMOVE',
    CLEAR: 'CLEAR',
} as const;

export type CartOperationType = keyof typeof CART_OPERATION_TYPES;

export const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
