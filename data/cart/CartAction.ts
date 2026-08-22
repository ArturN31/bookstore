'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUserData } from '@/data/user/UserService';
import { cartSchema } from '@/data/schemas/cartSchema';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { ensureCartExists, executeCartOperation, clearUsersCart } from '@/data/cart/CartService';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { CART_SUCCESS_MESSAGES } from '@/data/cart/CartConstants';

export type CartFormState = {
    success: boolean;
    message: string;
    validationErrors?: z.core.$ZodIssue[];
    timestamp?: number;
};

export async function CartAction(
    prevState: CartFormState | undefined,
    formData: FormData,
): Promise<CartFormState> {
    const actionType = formData.get('action-type');
    let userId: string | null = null;

    try {
        const { data: user, error: authError } = await getUserData();

        if (authError || !user) {
            const sanitizedError = authError
                ? sanitizeSupabaseError(authError)
                : 'Authorization required.';
            void recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {
                operation: 'CartAction_auth_failed',
                actionType,
                error: sanitizedError,
            });
            return {
                success: false,
                message: sanitizedError,
            };
        }

        userId = user.id;

        const cartContext = await ensureCartExists(userId);
        if (cartContext.error || !cartContext.data) {
            const sanitizedError = cartContext.error
                ? sanitizeSupabaseError(cartContext.error)
                : 'Cart initialization failed.';

            return {
                success: false,
                message: sanitizedError,
            };
        }

        if (actionType === 'CLEAR') {
            const result = await clearUsersCart(cartContext.data);
            if (result.error) {
                return {
                    success: false,
                    message: sanitizeSupabaseError(result.error),
                };
            }

            revalidatePath('/', 'layout');

            return {
                success: true,
                message: CART_SUCCESS_MESSAGES.CLEAR,
                timestamp: Date.now(),
            };
        }

        const rawData = {
            bookId: formData.get('book-id'),
            bookQuantity: formData.get('book-quantity') || '1',
            actionType,
        };

        const validated = cartSchema.safeParse(rawData);
        if (!validated.success)
            return {
                success: false,
                message: 'Invalid cart request.',
                validationErrors: validated.error.issues,
            };

        const { bookId, bookQuantity } = validated.data;

        const result = await executeCartOperation(
            actionType as string,
            cartContext.data,
            bookId,
            bookQuantity,
        );

        if (result.error) {
            const sanitizedError = sanitizeSupabaseError(result.error);
            return {
                success: false,
                message: sanitizedError,
            };
        }

        revalidatePath('/', 'layout');

        return {
            success: true,
            message: result.message || 'Cart updated successfully.',
            timestamp: Date.now(),
        };
    } catch (err: unknown) {
        console.error('[CartAction] Critical Error:', err);
        const sanitizedError = sanitizeSupabaseError(err);
        return {
            success: false,
            message: sanitizedError,
        };
    }
}
