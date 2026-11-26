import { createAdminClient } from '@/utils/db/admin';
import {
    completeDevToolsAuditIntent,
    persistDevToolsAuditIntent,
    processDevToolsAuditOutbox,
    queueDevToolsAuditEvent,
} from '@/utils/security/devToolsAuditOutbox';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

type QueryResult = { data?: unknown; error: { message: string } | null };
type QueryMock = Record<string, jest.Mock> & {
    then: (
        onfulfilled: (value: QueryResult) => unknown,
        onrejected?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
};

const createQuery = (result: QueryResult) => {
    const query = {} as QueryMock;
    const chainMethods = [
        'insert',
        'update',
        'delete',
        'upsert',
        'select',
        'eq',
        'lt',
        'lte',
        'order',
        'limit',
    ];

    chainMethods.forEach((method) => {
        query[method] = jest.fn().mockReturnValue(query);
    });
    query.single = jest.fn().mockResolvedValue(result);
    query.maybeSingle = jest.fn().mockResolvedValue(result);
    query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return query;
};

const createSupabaseMock = (queriesByTable: Record<string, ReturnType<typeof createQuery>[]>) => ({
    from: jest.fn((table: string) => {
        const query = queriesByTable[table]?.shift();
        if (!query) throw new Error(`No query mock configured for ${table}.`);
        return query;
    }),
});

describe('DevTools audit outbox', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('persists an intent and returns its durable ID', async () => {
        const insertQuery = createQuery({ data: { id: 'audit-1' }, error: null });
        const supabase = createSupabaseMock({ dev_tools_audit_outbox: [insertQuery] });
        jest.mocked(createAdminClient).mockResolvedValue(supabase as never);

        await expect(
            persistDevToolsAuditIntent('ADMIN_ACTION', 'user-1', {
                operation: 'full_reset',
                phase: 'intent',
            }),
        ).resolves.toBe('audit-1');
        expect(insertQuery.insert).toHaveBeenCalledWith({
            event_type: 'ADMIN_ACTION',
            user_id: 'user-1',
            metadata: expect.objectContaining({
                operation: 'full_reset',
                phase: 'intent',
                ip: expect.any(String),
                userAgent: expect.any(String),
                timestamp: expect.any(String),
            }),
            status: 'intent',
        });
    });

    it('rejects intent persistence errors so a privileged action can be blocked', async () => {
        const insertQuery = createQuery({
            data: null,
            error: { message: 'database unavailable' },
        });
        jest.mocked(createAdminClient).mockResolvedValue(
            createSupabaseMock({ dev_tools_audit_outbox: [insertQuery] }) as never,
        );

        await expect(
            persistDevToolsAuditIntent('ADMIN_ACTION', null, { operation: 'full_reset' }),
        ).rejects.toThrow('DevTools audit intent could not be stored: database unavailable');
    });

    it('queues rejected access events for later delivery', async () => {
        const insertQuery = createQuery({ data: { id: 'audit-2' }, error: null });
        jest.mocked(createAdminClient).mockResolvedValue(
            createSupabaseMock({ dev_tools_audit_outbox: [insertQuery] }) as never,
        );

        await expect(
            queueDevToolsAuditEvent('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'dev_tools',
                reason: 'unknown_command',
            }),
        ).resolves.toBe('audit-2');
        expect(insertQuery.insert).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'pending' }),
        );
    });

    it('retries completing an intent after a transient database error', async () => {
        const existingIntent = createQuery({
            data: {
                metadata: {
                    operation: 'add_books',
                    phase: 'intent',
                    ip: '192.0.2.1',
                    userAgent: 'test-agent',
                    timestamp: '2026-01-01T00:00:00.000Z',
                },
            },
            error: null,
        });
        const failedUpdate = createQuery({
            data: null,
            error: { message: 'temporary failure' },
        });
        const successfulUpdate = createQuery({ data: { id: 'audit-3' }, error: null });
        jest.mocked(createAdminClient).mockResolvedValue(
            createSupabaseMock({
                dev_tools_audit_outbox: [existingIntent, failedUpdate, successfulUpdate],
            }) as never,
        );

        await expect(
            completeDevToolsAuditIntent('audit-3', {
                operation: 'add_books',
                phase: 'outcome',
                outcome: 'success',
            }),
        ).resolves.toBeUndefined();
        expect(failedUpdate.update).toHaveBeenCalledTimes(1);
        expect(failedUpdate.update).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: expect.objectContaining({
                    ip: '192.0.2.1',
                    userAgent: 'test-agent',
                    phase: 'outcome',
                    outcome: 'success',
                }),
            }),
        );
        expect(successfulUpdate.update).toHaveBeenCalledTimes(1);
    });

    it('recovers stale intents and schedules failed delivery for retry', async () => {
        const staleSelect = createQuery({
            data: [{ id: 'stale-1', metadata: { operation: 'full_reset', phase: 'intent' } }],
            error: null,
        });
        const recoverUpdate = createQuery({ data: null, error: null });
        const pendingSelect = createQuery({
            data: [
                {
                    id: 'stale-1',
                    user_id: null,
                    event_type: 'ADMIN_ACTION',
                    metadata: { operation: 'full_reset', phase: 'outcome_unknown', outcome: 'unknown' },
                    attempts: 0,
                },
            ],
            error: null,
        });
        const failedDelivery = createQuery({
            data: null,
            error: { message: 'audit table unavailable' },
        });
        const retryUpdate = createQuery({ data: null, error: null });
        const supabase = createSupabaseMock({
            dev_tools_audit_outbox: [staleSelect, recoverUpdate, pendingSelect, retryUpdate],
            audit_logs: [failedDelivery],
        });
        jest.mocked(createAdminClient).mockResolvedValue(supabase as never);
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(processDevToolsAuditOutbox()).resolves.toEqual({
            recoveredIntents: 1,
            delivered: 0,
            retryScheduled: 1,
        });

        expect(recoverUpdate.update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'pending',
                metadata: expect.objectContaining({ outcome: 'unknown' }),
            }),
        );
        expect(retryUpdate.update).toHaveBeenCalledWith(
            expect.objectContaining({
                attempts: 1,
                last_error: 'audit_log_delivery_failed',
            }),
        );
        errorSpy.mockRestore();
    });

    it('delivers pending events idempotently and removes them from the outbox', async () => {
        const noStaleIntents = createQuery({ data: [], error: null });
        const pendingEvents = createQuery({
            data: [
                {
                    id: 'audit-4',
                    user_id: 'user-1',
                    event_type: 'ADMIN_ACTION',
                    metadata: { operation: 'add_books', outcome: 'success' },
                    attempts: 0,
                },
            ],
            error: null,
        });
        const delivery = createQuery({ data: null, error: null });
        const deleteEvent = createQuery({ data: null, error: null });
        jest.mocked(createAdminClient).mockResolvedValue(
            createSupabaseMock({
                dev_tools_audit_outbox: [noStaleIntents, pendingEvents, deleteEvent],
                audit_logs: [delivery],
            }) as never,
        );

        await expect(processDevToolsAuditOutbox()).resolves.toEqual({
            recoveredIntents: 0,
            delivered: 1,
            retryScheduled: 0,
        });
        expect(delivery.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'audit-4',
                user_id: 'user-1',
                event_type: 'ADMIN_ACTION',
            }),
            { onConflict: 'id', ignoreDuplicates: true },
        );
        expect(deleteEvent.delete).toHaveBeenCalled();
    });
});
