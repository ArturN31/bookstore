'use server';

import { createBackendClient } from '@/utils/db/server';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { cancelOrderRpc } from './OrderCancelRepository';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
    readonly success: boolean;
    readonly error?: string;
}

const cancelOrderSchema = z.object({
    orderId: z.string().uuid('Invalid order reference format.'),
});

export const cancelOrderAction = async (orderId: string): Promise<ActionResult> => {
    try {
        const parseResult = cancelOrderSchema.safeParse({ orderId });
        if (!parseResult.success)
            return {
                success: false,
                error: parseResult.error.issues[0]?.message,
            };

        const clientIp = await getAppClientIp();
        const ipRateLimit = await verifyRateLimit({
            identifier: `ip:${clientIp}`,
            limiter: limiters.checkout,
            failClosed: true,
        });
        if (!ipRateLimit.success)
            return {
                success: false,
                error: ipRateLimit.error ?? 'Too many requests. Please try again later.',
            };

        const supabase = await createBackendClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user)
            return {
                success: false,
                error: APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
            };

        const userRateLimit = await verifyRateLimit({
            identifier: `user:${user.id}`,
            limiter: limiters.checkout,
            failClosed: true,
        });
        if (!userRateLimit.success)
            return {
                success: false,
                error: userRateLimit.error ?? 'Too many requests. Please try again later.',
            };

        const rpcResult = await cancelOrderRpc(supabase, parseResult.data.orderId, user.id);

        if (rpcResult.error)
            return {
                success: false,
                error: sanitizeSupabaseError(rpcResult.error),
            };

        const responseData = rpcResult.data as unknown as {
            readonly success: boolean;
            readonly error?: string;
        };

        if (!responseData || !responseData.success) {
            const errCode = responseData?.error;
            if (errCode === 'CANNOT_CANCEL_ORDER')
                return { success: false, error: 'Only pending orders can be cancelled.' };
            if (errCode === 'ORDER_NOT_FOUND')
                return { success: false, error: APP_ERROR_MESSAGES.ORDER_NOT_FOUND };
            return { success: false, error: 'Failed to cancel the order.' };
        }

        revalidatePath(`/user/order/${orderId}`);
        revalidatePath('/user/profile');

        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: sanitizeSupabaseError(err),
        };
    }
};
