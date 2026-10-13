import { createBackendClient } from '@/utils/db/server';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { getOrderDetailsById } from './CheckoutService';
import { OrderWithRelations } from '../CheckoutTypes';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';

export type OwnershipCheckResult =
    | { readonly status: 'UNAUTHENTICATED'; readonly order: null }
    | { readonly status: 'NOT_FOUND'; readonly order: null }
    | { readonly status: 'UNAUTHORIZED'; readonly order: null }
    | { readonly status: 'RATE_LIMITED'; readonly order: null; readonly message: string }
    | { readonly status: 'SUCCESS'; readonly order: OrderWithRelations };

export async function verifyOrderOwnershipAndFetch(orderId: string): Promise<OwnershipCheckResult> {
    if (!orderId || typeof orderId !== 'string') return { status: 'NOT_FOUND', order: null };

    const ip = await getAppClientIp();
    const ipRateLimit = await verifyRateLimit({
        identifier: `ip:${ip}`,
        limiter: limiters.search,
        failClosed: true,
    });
    if (!ipRateLimit.success)
        return {
            status: 'RATE_LIMITED',
            order: null,
            message: ipRateLimit.error ?? 'Too many order requests. Please try again later.',
        };

    const supabase = await createBackendClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { status: 'UNAUTHENTICATED', order: null };

    const userRateLimit = await verifyRateLimit({
        identifier: `user:${user.id}`,
        limiter: limiters.search,
        failClosed: true,
    });
    if (!userRateLimit.success)
        return {
            status: 'RATE_LIMITED',
            order: null,
            message: userRateLimit.error ?? 'Too many order requests. Please try again later.',
        };

    let orderResult = await getOrderDetailsById(orderId);
    let attempts = 0;
    while ((orderResult.error || !orderResult.data) && attempts < 3) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 300));
        orderResult = await getOrderDetailsById(orderId);
    }

    if (orderResult.error || !orderResult.data) return { status: 'NOT_FOUND', order: null };

    const order = orderResult.data;
    if (order.user_id !== user.id) {
        await recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', user.id, {
            resource: 'ORDER_CONFIRMATION',
            orderId: order.id,
            resourceOwnerUserId: order.user_id,
            attemptedUserId: user.id,
        });
        return { status: 'UNAUTHORIZED', order: null };
    }

    return { status: 'SUCCESS', order };
}
