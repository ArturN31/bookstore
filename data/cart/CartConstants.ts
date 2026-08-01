export const CART_SUCCESS_MESSAGES = {
    INSERT: 'Item added to your cart!',
    UPDATE: 'Cart quantity updated.',
    REMOVE: 'Item removed from your cart.',
    DEFAULT: 'Cart updated successfully.',
} as const;

export const CART_OPERATION_TYPES = {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    REMOVE: 'REMOVE',
} as const;

export type CartOperationType = keyof typeof CART_OPERATION_TYPES;
