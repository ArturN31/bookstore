'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as service from './DevToolsService';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
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

function recordDevToolsAction(
    action: string,
    outcome: 'success' | 'failure',
    userId: string | null,
    command?: string,
): void {
    void recordSecurityAuditLog('ADMIN_ACTION', userId, {
        operation: action,
        ...(command ? { command } : {}),
        outcome,
    });
}

function recordUnauthorizedDevToolsAttempt(reason: string, userId: string | null = null): void {
    void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
        operation: 'dev_tools',
        reason,
    });
}

/**
 * Checks the privileged DevTools limiter using the client IP and authenticated user when available.
 *
 * @returns The authenticated user ID when available after authorization succeeds.
 * @throws If the limiter rejects the request or fails closed.
 */
async function checkDevToolsRateLimit(): Promise<string | null> {
    const clientIp = await getAppClientIp();
    let identifiers: [string, ...string[]] = [`ip:${clientIp}`];
    let userId: string | null = null;

    try {
        const supabase = await createBackendClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
            userId = user.id;
            identifiers = [`ip:${clientIp}`, `user:${user.id}`];
        }
    } catch {
        // Fall back to clientIp if session verification fails
    }

    const rateLimit = await verifyRateLimit({
        identifiers,
        limiter: limiters.privileged,
        failClosed: true,
    }).catch((error: unknown) => {
        recordUnauthorizedDevToolsAttempt('rate_limit_check_failed', userId);
        throw error;
    });

    if (!rateLimit.success) {
        recordUnauthorizedDevToolsAttempt('rate_limit_exceeded', userId);
        throw new Error(
            rateLimit.error ?? 'Unauthorized: Dev tools execution rate limit exceeded.',
        );
    }

    return userId;
}

/**
 * Creates a write-authorization callback that checks the rate limit at most once.
 *
 * @returns A write callback with access to the authorized user ID after it succeeds.
 */
function createWriteAuthorization(): {
    authorizeWrite: service.AuthorizeWrite;
    getUserId: () => string | null;
} {
    let authorization: Promise<string | null> | undefined;
    let userId: string | null = null;

    const authorizeWrite = async (): Promise<void> => {
        if (!authorization) authorization = checkDevToolsRateLimit();
        userId = await authorization;
    };

    return { authorizeWrite, getUserId: () => userId };
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
    if (!isDevToolsEnabled()) {
        recordUnauthorizedDevToolsAttempt('dev_tools_disabled');
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };
    }

    if (!isDevToolsDatabaseTargetAllowed()) {
        recordUnauthorizedDevToolsAttempt('database_target_not_allowed');
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };
    }

    const commandValue = formData.get('command');
    if (typeof commandValue !== 'string') {
        recordUnauthorizedDevToolsAttempt('invalid_command');
        return { message: 'A valid command is required.', success: false };
    }

    const command = commandValue;
    const handler = COMMAND_REGISTRY[command];

    if (!handler) {
        recordUnauthorizedDevToolsAttempt('unknown_command');
        return { message: `Unknown Command: ${command}`, success: false };
    }

    const writeAuthorization = createWriteAuthorization();
    try {
        const supabase = await createAdminClient();
        const result = await handler(supabase, writeAuthorization.authorizeWrite);

        recordDevToolsAction(
            'system_command',
            result.success ? 'success' : 'failure',
            writeAuthorization.getUserId(),
            command,
        );
        revalidatePath('/');
        return result;
    } catch (e: unknown) {
        recordDevToolsAction(
            'system_command',
            'failure',
            writeAuthorization.getUserId(),
            command,
        );
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
    if (!isDevToolsEnabled()) {
        recordUnauthorizedDevToolsAttempt('dev_tools_disabled');
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };
    }

    if (!isDevToolsDatabaseTargetAllowed()) {
        recordUnauthorizedDevToolsAttempt('database_target_not_allowed');
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };
    }

    const writeAuthorization = createWriteAuthorization();
    try {
        await runFullDatabaseSeed(writeAuthorization.authorizeWrite);
        recordDevToolsAction('full_reset', 'success', writeAuthorization.getUserId());
        revalidatePath('/');
        return { message: 'Full Reset Complete', success: true };
    } catch (error: unknown) {
        recordDevToolsAction('full_reset', 'failure', writeAuthorization.getUserId());
        console.error('[DevTools] Full reset failed:', error);
        const message = error instanceof Error ? error.message : 'Operation Failed';
        return { message: `Reset Failed: ${message}`, success: false };
    }
}
