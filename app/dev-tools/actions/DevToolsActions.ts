'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as service from './DevToolsService';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import {
    DEV_TOOLS_DATABASE_TARGET_ERROR,
    DEV_TOOLS_UNAVAILABLE_MESSAGE,
    isDevToolsDatabaseTargetAllowed,
    isDevToolsEnabled,
} from '../devToolsAccess';

const COMMAND_REGISTRY: Record<string, service.CommandHandler> = {
    add_sales: service.addSales,
    seed_discounts: service.seedDiscounts,
    stock_purge: service.stockPurge,
    review_bomb: service.reviewBomb,
    add_carts: service.addCarts,
    add_wishlists: service.addWishlists,
    add_books: service.addBooks,
};

/**
 * Checks the privileged DevTools limiter using the client IP and authenticated user when available.
 *
 * @throws If the limiter rejects the request or fails closed.
 */
async function checkDevToolsRateLimit(): Promise<void> {
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
        throw new Error(
            rateLimit.error ?? 'Unauthorized: Dev tools execution rate limit exceeded.',
        );
}

/**
 * Creates a write-authorization callback that checks the rate limit at most once.
 *
 * @returns A callback that shares the same authorization result across repeated calls.
 */
function createWriteAuthorization(): service.AuthorizeWrite {
    let authorization: Promise<void> | undefined;

    return () => {
        if (!authorization) authorization = checkDevToolsRateLimit();
        return authorization;
    };
}

/**
 * Validates and executes a registered additive DevTools command.
 *
 * @param prevState Previous action state required by React's action-state API.
 * @param formData Submitted form data containing the command name.
 * @returns The command result, or a failure response for invalid access, command, or execution.
 */
export async function systemCommandAction(
    prevState: service.CommandResponse,
    formData: FormData,
): Promise<service.CommandResponse> {
    if (!isDevToolsEnabled()) return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };

    if (!isDevToolsDatabaseTargetAllowed())
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };

    const commandValue = formData.get('command');
    if (typeof commandValue !== 'string')
        return { message: 'A valid command is required.', success: false };

    const command = commandValue;
    const handler = COMMAND_REGISTRY[command];

    if (!handler) return { message: `Unknown Command: ${command}`, success: false };

    try {
        const supabase = await createAdminClient();
        const result = await handler(supabase, createWriteAuthorization());

        revalidatePath('/');
        return result;
    } catch (e: unknown) {
        console.error(`[DevTools] Command "${command}" failed:`, e);
        const errorMessage = e instanceof Error ? e.message : 'Operation Failed';
        return { message: errorMessage, success: false };
    }
}

/**
 * Runs the full database reset and seed operation in an allowed development environment.
 *
 * @param prevState Previous action state required by React's action-state API; unused by reset.
 * @param formData Submitted form data; unused because reset is a dedicated action.
 * @returns A success response when reset completes, otherwise a failure response.
 */
export async function fullResetAction(
    prevState: service.CommandResponse,
    formData: FormData,
): Promise<service.CommandResponse> {
    if (!isDevToolsEnabled()) return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };

    if (!isDevToolsDatabaseTargetAllowed())
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };

    try {
        await runFullDatabaseSeed(checkDevToolsRateLimit);
        revalidatePath('/');
        return { message: 'Full Reset Complete', success: true };
    } catch (error: unknown) {
        console.error('[DevTools] Full reset failed:', error);
        const message = error instanceof Error ? error.message : 'Operation Failed';
        return { message: `Reset Failed: ${message}`, success: false };
    }
}
