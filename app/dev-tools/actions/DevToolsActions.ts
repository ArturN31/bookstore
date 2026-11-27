'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as service from './DevToolsService';
import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import {
    completeDevToolsAuditIntent,
    persistDevToolsAuditIntent,
    processDevToolsAuditOutbox,
    queueDevToolsAuditEvent,
} from '@/utils/security/devToolsAuditOutbox';
import type { Json } from '@/database.types';
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

async function processDevToolsAuditOutboxBestEffort(): Promise<void> {
    try {
        await processDevToolsAuditOutbox();
    } catch (error: unknown) {
        console.error('[SecurityAudit] Failed to process DevTools audit outbox.', error);
    }
}

async function queueDevToolsAuditEventAndProcess(
    eventType: 'ADMIN_ACTION' | 'UNAUTHORIZED_ACCESS_ATTEMPT',
    userId: string | null,
    metadata: Json,
): Promise<void> {
    await queueDevToolsAuditEvent(eventType, userId, metadata);
    await processDevToolsAuditOutboxBestEffort();
}

async function recordUnauthorizedDevToolsAttempt(
    reason: string,
    userId: string | null = null,
): Promise<void> {
    try {
        await queueDevToolsAuditEventAndProcess('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'dev_tools',
            reason,
        });
    } catch (error: unknown) {
        console.error('[SecurityAudit] Failed to queue rejected DevTools access attempt.', error);
    }
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

    let rateLimit;
    try {
        rateLimit = await verifyRateLimit({
            identifiers,
            limiter: limiters.privileged,
            failClosed: true,
        });
    } catch (error: unknown) {
        await queueDevToolsAuditEventAndProcess('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'dev_tools',
            reason: 'rate_limit_check_failed',
        });
        throw error;
    }

    if (!rateLimit.success) {
        await queueDevToolsAuditEventAndProcess('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'dev_tools',
            reason: 'rate_limit_exceeded',
        });
        throw new Error(
            rateLimit.error ?? 'Unauthorized: Dev tools execution rate limit exceeded.',
        );
    }

    return userId;
}

type WriteAuthorizationContext = {
    authorizeWrite: service.AuthorizeWrite;
    getUserId: () => string | null;
    getIntentId: () => string | null;
    wasAttempted: () => boolean;
    getStartedAt: () => number | null;
};

/**
 * Creates a write callback that rate-limits once and persists an intent before mutation.
 *
 * @param action Name of the DevTools operation.
 * @param command Additive command name when applicable.
 * @returns Authorization state used to persist the final outcome.
 */
function createWriteAuthorization(action: string, command?: string): WriteAuthorizationContext {
    let authorization: Promise<string | null> | undefined;
    let userId: string | null = null;
    let intentId: string | null = null;
    let startedAt: number | null = null;

    const authorizeWrite = async (): Promise<void> => {
        if (!authorization) {
            authorization = (async () => {
                userId = await checkDevToolsRateLimit();
                intentId = await persistDevToolsAuditIntent('ADMIN_ACTION', userId, {
                    operation: action,
                    ...(command ? { command } : {}),
                    phase: 'intent',
                });
                startedAt = Date.now();
                return userId;
            })();
        }
        await authorization;
    };

    return {
        authorizeWrite,
        getUserId: () => userId,
        getIntentId: () => intentId,
        wasAttempted: () => authorization !== undefined,
        getStartedAt: () => startedAt,
    };
}

async function recordDevToolsActionOutcome(
    context: WriteAuthorizationContext,
    action: string,
    outcome: 'success' | 'failure',
    command?: string,
): Promise<void> {
    const startedAt = context.getStartedAt();
    const metadata: Json = {
        operation: action,
        ...(command ? { command } : {}),
        phase: 'outcome',
        outcome,
        durationMs: startedAt === null ? null : Date.now() - startedAt,
    };
    const intentId = context.getIntentId();

    try {
        if (intentId) await completeDevToolsAuditIntent(intentId, metadata);
        else if (!context.wasAttempted())
            await queueDevToolsAuditEvent('ADMIN_ACTION', context.getUserId(), metadata);
    } catch (error: unknown) {
        console.error('[SecurityAudit] Failed to queue DevTools action outcome.', error);
    }
    await processDevToolsAuditOutboxBestEffort();
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
        await recordUnauthorizedDevToolsAttempt('dev_tools_disabled');
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };
    }

    if (!isDevToolsDatabaseTargetAllowed()) {
        await recordUnauthorizedDevToolsAttempt('database_target_not_allowed');
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };
    }

    const commandValue = formData.get('command');
    if (typeof commandValue !== 'string') {
        await recordUnauthorizedDevToolsAttempt('invalid_command');
        return { message: 'A valid command is required.', success: false };
    }

    const command = commandValue;
    const handler = COMMAND_REGISTRY[command];

    if (!handler) {
        await recordUnauthorizedDevToolsAttempt('unknown_command');
        return { message: `Unknown Command: ${command}`, success: false };
    }

    const writeAuthorization = createWriteAuthorization('system_command', command);
    try {
        const supabase = await createAdminClient();
        const result = await handler(supabase, writeAuthorization.authorizeWrite);

        await recordDevToolsActionOutcome(
            writeAuthorization,
            'system_command',
            result.success ? 'success' : 'failure',
            command,
        );
        revalidatePath('/');
        return result;
    } catch (e: unknown) {
        await recordDevToolsActionOutcome(writeAuthorization, 'system_command', 'failure', command);
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
        await recordUnauthorizedDevToolsAttempt('dev_tools_disabled');
        return { message: DEV_TOOLS_UNAVAILABLE_MESSAGE, success: false };
    }

    if (!isDevToolsDatabaseTargetAllowed()) {
        await recordUnauthorizedDevToolsAttempt('database_target_not_allowed');
        return { message: DEV_TOOLS_DATABASE_TARGET_ERROR, success: false };
    }

    const writeAuthorization = createWriteAuthorization('full_reset');
    try {
        await runFullDatabaseSeed(writeAuthorization.authorizeWrite);
        await recordDevToolsActionOutcome(writeAuthorization, 'full_reset', 'success');
        revalidatePath('/');
        return { message: 'Full Reset Complete', success: true };
    } catch (error: unknown) {
        await recordDevToolsActionOutcome(writeAuthorization, 'full_reset', 'failure');
        console.error('[DevTools] Full reset failed:', error);
        const message = error instanceof Error ? error.message : 'Operation Failed';
        return { message: `Reset Failed: ${message}`, success: false };
    }
}
