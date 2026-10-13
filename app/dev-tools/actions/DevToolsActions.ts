'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as service from './DevToolsService';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';

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
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true')
        return { message: 'Unauthorized: Command rejected in production.', success: false };

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
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true')
        return { message: 'Unauthorized', success: false };

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

/**
 * AUTH TOOLS
 */
export async function impulseLogin(email: string): Promise<{ success: boolean }> {
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_PRODUCTION === 'true')
        throw new Error('Unauthorized: Dev tools are unavailable in production.');

    const clientIp = await getAppClientIp();

    const rateLimit = await verifyRateLimit({
        identifiers: [`ip:${clientIp}`, `email:${email.trim().toLowerCase()}`],
        limiter: limiters.privileged,
        failClosed: true,
    });

    if (!rateLimit.success)
        throw new Error(
            rateLimit.error ?? 'Unauthorized: Dev tools impulse login rate limit exceeded.',
        );

    const adminClient = await createAdminClient();
    const supabase = await createBackendClient();

    const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw new Error('LIST_USERS_FAILED: ' + listError.message);

    const targetUser = userList?.users.find((u: { email?: string }) => u.email === email);
    if (!targetUser) throw new Error('USER_NOT_FOUND: No user found with email ' + email);

    const userId = targetUser.id;

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: 'DevTempPassword123!',
    });
    if (updateError) throw new Error('ADMIN_UPDATE_FAILED: ' + updateError.message);

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'DevTempPassword123!',
    });

    if (signInError) throw new Error('SIGN_IN_FAILED: ' + signInError.message);
    return { success: true };
}
