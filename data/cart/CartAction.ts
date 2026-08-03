'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUserData } from '@/data/user/UserService';
import { cartSchema } from '@/data/schemas/cartSchema';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { ensureCartExists, executeCartOperation } from '@/data/cart/CartService';

export type CartFormState = {
    success: boolean;
    message: string;
    validationErrors?: z.ZodIssue[];
    timestamp?: number;
};

export async function CartAction(
    prevState: CartFormState | undefined,
    formData: FormData,
): Promise<CartFormState> {
    const rawData = {
        bookId: formData.get('book-id'),
        bookQuantity: formData.get('book-quantity') || '1',
        actionType: formData.get('action-type'),
    };

    const validated = cartSchema.safeParse(rawData);
    if (!validated.success)
        return {
            success: false,
            message: 'Invalid cart request.',
            validationErrors: validated.error.issues,
        };

    const { bookId, bookQuantity, actionType } = validated.data;

    try {
        const { data: user, error: authError } = await getUserData();
        if (authError || !user)
            return {
                success: false,
                message: authError ? sanitizeSupabaseError(authError) : 'Authorization required.',
            };

        const cartContext = await ensureCartExists(user.id);
        if (cartContext.error || !cartContext.data)
            return {
                success: false,
                message: cartContext.error
                    ? sanitizeSupabaseError(cartContext.error)
                    : 'Cart initialization failed.',
            };

        const result = await executeCartOperation(
            actionType,
            cartContext.data,
            bookId,
            bookQuantity,
        );
        if (result.error)
            return {
                success: false,
                message: sanitizeSupabaseError(result.error),
            };

        revalidatePath('/', 'layout');

        return {
            success: true,
            message: result.message || 'Cart updated successfully.',
            timestamp: Date.now(),
        };
    } catch (err: unknown) {
        console.error('[CartAction] Critical Error:', err);
        return {
            success: false,
            message: sanitizeSupabaseError(err),
        };
    }
}
