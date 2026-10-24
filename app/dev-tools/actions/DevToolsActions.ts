'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as service from './DevToolsService';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { DEV_TOOLS_UNAVAILABLE_MESSAGE, isDevToolsEnabled } from '../devToolsAccess';

const COMMAND_REGISTRY: Record<string, service.CommandHandler> = {
    add_sales: service.addSales,
    seed_discounts: service.seedDiscounts,
    stock_purge: service.stockPurge,
    review_bomb: service.reviewBomb,
    add_carts: service.addCarts,
    add_wishlists: service.addWishlists,
    add_books: service.addBooks,
};

async function checkDevToolsRateLimit(): Promise<service.CommandResponse | null> {
    const clientIp = await getAppClientIp();
    let identifiers: [string, ...string[]] = [`ip:${clientIp}`];

    try {
        const supabase = await createBackendClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) identifiers = [`ip:${clientIp}`, `user:${user.id}`];
    } catch {
        // Fall back to clientIp if session verification fails
    }

    const rateLimit = await verifyRateLimit({
        identifiers,
        limiter: limiters.privileged,
        failClosed: true,
    });

    if (!rateLimit.success)
        return {
            message: rateLimit.error ?? 'Unauthorized: Dev tools execution rate limit exceeded.',
            success: false,
        };
    return null;
}

/**
 * CORE COMMAND SYSTEM
 */
export async function systemCommandAction(
    prevState: service.CommandResponse,
    formData: FormData,
): Promise<service.CommandResponse> {
    if (!isDevToolsEnabled())
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };

    const rateLimitError = await checkDevToolsRateLimit();
    if (rateLimitError) return rateLimitError;

    const command = formData.get('command') as string;
    const handler = COMMAND_REGISTRY[command];

    if (!handler) return { message: `Unknown Command: ${command}`, success: false };

    try {
        const supabase = await createAdminClient();
        const result = await handler(supabase);

        revalidatePath('/');
        return result;
    } catch (e: unknown) {
        console.error(`[DevTools] Command "${command}" failed:`, e);
        const errorMessage = e instanceof Error ? e.message : 'Operation Failed';
        return { message: errorMessage, success: false };
    }
}

/**
 * NUCLEAR OPTION
 */
export async function fullResetAction(
    prevState: service.CommandResponse,
    formData: FormData,
): Promise<service.CommandResponse> {
    if (!isDevToolsEnabled())
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };

    const rateLimitError = await checkDevToolsRateLimit();
    if (rateLimitError) return rateLimitError;

    try {
        await runFullDatabaseSeed();
        revalidatePath('/');
        return { message: 'Full Reset Complete', success: true };
    } catch (e: unknown) {
        return { message: 'Reset Failed', success: false };
    }
}
