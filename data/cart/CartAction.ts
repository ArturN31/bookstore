'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUserData } from '@/data/user/UserService';
import { cartSchema } from '@/data/schemas/cartSchema';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { ensureCartExists, executeCartOperation } from '@/data/cart/CartService';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

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
    if (!validated.success) {
        return {
            success: false,
            message: 'Invalid cart request.',
            validationErrors: validated.error.issues,
        };
    }

    const { bookId, bookQuantity, actionType } = validated.data;
    let userId: string | null = null;

    try {
        const { data: user, error: authError } = await getUserData();

        if (authError || !user) {
            const sanitizedError = authError
                ? sanitizeSupabaseError(authError)
                : 'Authorization required.';
            void recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {
                operation: 'CartAction_auth_failed',
                bookId,
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

            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
                operation: 'CartAction_init_failed',
                bookId,
                actionType,
                error: sanitizedError,
            });

            return {
                success: false,
                message: sanitizedError,
            };
        }

        const result = await executeCartOperation(
            actionType,
            cartContext.data,
            bookId,
            bookQuantity,
        );

        if (result.error) {
            const sanitizedError = sanitizeSupabaseError(result.error);

            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
                operation: 'CartAction_operation_failed',
                bookId,
                bookQuantity,
                actionType,
                error: sanitizedError,
            });

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

        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'CartAction_critical_failure',
            bookId,
            bookQuantity,
            actionType,
            error: sanitizedError,
        });

        return {
            success: false,
            message: sanitizedError,
        };
    }
}
