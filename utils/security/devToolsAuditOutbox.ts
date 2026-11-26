import type { Database, Json } from '@/database.types';
import { createAdminClient } from '@/utils/db/admin';
import {
    getSecurityAuditRequestMetadata,
    type SecurityAuditEventType,
} from './securityAuditLogger';

type DevToolsAuditStatus = 'intent' | 'pending';
type DevToolsAuditRow = Pick<
    Database['public']['Tables']['dev_tools_audit_outbox']['Row'],
    'id' | 'user_id' | 'event_type' | 'metadata' | 'attempts'
>;

const STALE_INTENT_AGE_MS = 30 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const BATCH_SIZE = 50;

export type DevToolsAuditBatchResult = {
    recoveredIntents: number;
    delivered: number;
    retryScheduled: number;
};

const asMetadata = (metadata: Json): { [key: string]: Json | undefined } =>
    metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};

async function insertOutboxEvent(
    eventType: SecurityAuditEventType,
    userId: string | null,
    metadata: Json,
    status: DevToolsAuditStatus,
): Promise<string> {
    const supabase = await createAdminClient();
    const enrichedMetadata: Json = {
        ...asMetadata(metadata),
        ...(await getSecurityAuditRequestMetadata()),
    };
    const { data, error } = await supabase
        .from('dev_tools_audit_outbox')
        .insert({ event_type: eventType, user_id: userId, metadata: enrichedMetadata, status })
        .select('id')
        .single();

    if (error) throw new Error(`DevTools audit intent could not be stored: ${error.message}`);
    if (!data) throw new Error('DevTools audit intent insert returned no ID.');
    return data.id;
}

/**
 * Persists an action intent before its privileged database mutation.
 *
 * @param eventType Security audit event category.
 * @param userId Authenticated actor ID, if available.
 * @param metadata Sanitized action details to retain with the event.
 * @returns The durable outbox event ID.
 * @throws If the intent cannot be stored.
 */
export async function persistDevToolsAuditIntent(
    eventType: SecurityAuditEventType,
    userId: string | null,
    metadata: Json,
): Promise<string> {
    return insertOutboxEvent(eventType, userId, metadata, 'intent');
}

/**
 * Queues an audit event that does not need to authorize a subsequent mutation.
 *
 * @param eventType Security audit event category.
 * @param userId Authenticated actor ID, if available.
 * @param metadata Sanitized event details to retain.
 * @returns The durable outbox event ID.
 * @throws If the event cannot be stored.
 */
export async function queueDevToolsAuditEvent(
    eventType: SecurityAuditEventType,
    userId: string | null,
    metadata: Json,
): Promise<string> {
    return insertOutboxEvent(eventType, userId, metadata, 'pending');
}

/**
 * Attaches an action outcome to its durable intent and queues it for delivery.
 *
 * @param eventId ID returned when the intent was stored.
 * @param metadata Final action details including outcome and duration.
 * @throws If the intent cannot be updated; it remains available for stale-intent recovery.
 */
export async function completeDevToolsAuditIntent(
    eventId: string,
    metadata: Json,
): Promise<void> {
    const supabase = await createAdminClient();
    const { data: intent, error: intentError } = await supabase
        .from('dev_tools_audit_outbox')
        .select('metadata')
        .eq('id', eventId)
        .eq('status', 'intent')
        .maybeSingle();

    if (intentError)
        throw new Error(`DevTools audit outcome could not be queued: ${intentError.message}`);
    if (!intent)
        throw new Error('DevTools audit outcome could not be queued: intent is no longer pending.');

    const completedMetadata: Json = {
        ...asMetadata(intent.metadata),
        ...asMetadata(metadata),
    };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
            .from('dev_tools_audit_outbox')
            .update({
                metadata: completedMetadata,
                status: 'pending',
                next_attempt_at: new Date().toISOString(),
                last_error: null,
            })
            .eq('id', eventId)
            .eq('status', 'intent')
            .select('id')
            .maybeSingle();

        if (!error && data) return;
        lastError = new Error(
            error?.message ?? 'DevTools audit intent was not in a completable state.',
        );
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }

    throw new Error(`DevTools audit outcome could not be queued: ${lastError?.message}`);
}

const recoverStaleIntents = async (): Promise<number> => {
    const supabase = await createAdminClient();
    const staleBefore = new Date(Date.now() - STALE_INTENT_AGE_MS).toISOString();
    const { data, error } = await supabase
        .from('dev_tools_audit_outbox')
        .select('id, metadata')
        .eq('status', 'intent')
        .lt('created_at', staleBefore)
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

    if (error) throw new Error(`Failed to recover stale DevTools audit intents: ${error.message}`);
    if (!data?.length) return 0;

    const results = await Promise.all(
        data.map(async (intent) => {
            const { error: updateError } = await supabase
                .from('dev_tools_audit_outbox')
                .update({
                    metadata: {
                        ...asMetadata(intent.metadata),
                        phase: 'outcome_unknown',
                        outcome: 'unknown',
                    },
                    status: 'pending',
                    next_attempt_at: new Date().toISOString(),
                })
                .eq('id', intent.id)
                .eq('status', 'intent');

            if (updateError)
                throw new Error(`Failed to recover DevTools audit intent: ${updateError.message}`);
            return true;
        }),
    );

    return results.length;
};

const fetchPendingEvents = async (): Promise<DevToolsAuditRow[]> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('dev_tools_audit_outbox')
        .select('id, user_id, event_type, metadata, attempts')
        .eq('status', 'pending')
        .lte('next_attempt_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

    if (error) throw new Error(`Failed to fetch pending DevTools audit events: ${error.message}`);
    return data ?? [];
};

const retryDelay = (attempts: number): number =>
    Math.min(1000 * 2 ** Math.min(attempts, 12), MAX_RETRY_DELAY_MS);

const scheduleRetry = async (event: DevToolsAuditRow): Promise<void> => {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('dev_tools_audit_outbox')
        .update({
            attempts: event.attempts + 1,
            next_attempt_at: new Date(Date.now() + retryDelay(event.attempts)).toISOString(),
            last_error: 'audit_log_delivery_failed',
        })
        .eq('id', event.id)
        .eq('status', 'pending');

    if (error) throw new Error(`Failed to schedule DevTools audit retry: ${error.message}`);
};

/**
 * Recovers stale action intents and delivers queued events idempotently.
 *
 * @returns Counts of recovered intents, delivered events, and scheduled retries.
 * @throws If the outbox cannot be queried or an event cannot be scheduled for retry.
 */
export async function processDevToolsAuditOutbox(): Promise<DevToolsAuditBatchResult> {
    const recoveredIntents = await recoverStaleIntents();
    const events = await fetchPendingEvents();
    let delivered = 0;
    let retryScheduled = 0;
    const supabase = await createAdminClient();

    for (const event of events) {
        const { error: deliveryError } = await supabase.from('audit_logs').upsert(
            {
                id: event.id,
                user_id: event.user_id,
                event_type: event.event_type,
                metadata: event.metadata,
            },
            { onConflict: 'id', ignoreDuplicates: true },
        );

        if (deliveryError) {
            await scheduleRetry(event);
            retryScheduled++;
            console.error('[SecurityAudit] DevTools audit delivery failed; retry scheduled.');
            continue;
        }

        const { error: deleteError } = await supabase
            .from('dev_tools_audit_outbox')
            .delete()
            .eq('id', event.id)
            .eq('status', 'pending');

        if (deleteError) {
            await scheduleRetry(event);
            retryScheduled++;
            console.error('[SecurityAudit] Delivered DevTools audit event remains queued.');
            continue;
        }

        delivered++;
    }

    return { recoveredIntents, delivered, retryScheduled };
}
