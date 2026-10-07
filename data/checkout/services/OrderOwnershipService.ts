import { createBackendClient } from '@/utils/db/server';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { getOrderDetailsById } from './CheckoutService';
import { OrderWithRelations } from '../CheckoutTypes';

export type OwnershipCheckResult =
    | { readonly status: 'UNAUTHENTICATED'; readonly order: null }
    | { readonly status: 'NOT_FOUND'; readonly order: null }
    | { readonly status: 'UNAUTHORIZED'; readonly order: null }
    | { readonly status: 'SUCCESS'; readonly order: OrderWithRelations };

export async function verifyOrderOwnershipAndFetch(orderId: string): Promise<OwnershipCheckResult> {
    if (!orderId || typeof orderId !== 'string') return { status: 'NOT_FOUND', order: null };

    const supabase = await createBackendClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { status: 'UNAUTHENTICATED', order: null };

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
