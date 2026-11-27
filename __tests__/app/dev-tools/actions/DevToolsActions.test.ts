import { systemCommandAction, fullResetAction } from '@/app/dev-tools/actions/DevToolsActions';
import * as service from '@/app/dev-tools/actions/DevToolsService';
import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { verifyRateLimit } from '@/utils/network/rateLimiter';
import {
    completeDevToolsAuditIntent,
    persistDevToolsAuditIntent,
    processDevToolsAuditOutbox,
    queueDevToolsAuditEvent,
} from '@/utils/security/devToolsAuditOutbox';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/dbSeed/seedDatabase', () => ({
    runFullDatabaseSeed: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/app/dev-tools/actions/DevToolsService', () => ({
    addSales: jest.fn(),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { privileged: {} },
    verifyRateLimit: jest.fn(),
}));

jest.mock('@/utils/security/devToolsAuditOutbox', () => ({
    completeDevToolsAuditIntent: jest.fn().mockResolvedValue(undefined),
    persistDevToolsAuditIntent: jest.fn().mockResolvedValue('audit-intent-1'),
    processDevToolsAuditOutbox: jest.fn().mockResolvedValue({
        recoveredIntents: 0,
        delivered: 0,
        retryScheduled: 0,
    }),
    queueDevToolsAuditEvent: jest.fn().mockResolvedValue('audit-event-1'),
}));

describe('DevToolsActions', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalForceProduction = process.env.FORCE_PRODUCTION;
    const originalDatabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL;
    const originalAllowedDatabaseUrl = process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL;
    const env = process.env as Record<string, string | undefined>;
    const mockedVerifyRateLimit = verifyRateLimit as jest.Mock;

    const initialCommandResponse: service.CommandResponse = { message: '', success: false };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(persistDevToolsAuditIntent).mockResolvedValue('audit-intent-1');
        jest.mocked(queueDevToolsAuditEvent).mockResolvedValue('audit-event-1');
        jest.mocked(completeDevToolsAuditIntent).mockResolvedValue();
        jest.mocked(processDevToolsAuditOutbox).mockResolvedValue({
            recoveredIntents: 0,
            delivered: 0,
            retryScheduled: 0,
        });
        env.NODE_ENV = 'development';
        delete env.FORCE_PRODUCTION;
        env.NEXT_PUBLIC_SUPABASE_DB_URL = 'http://127.0.0.1:54321';
        env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'http://127.0.0.1:54321';

        mockedVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
        });

        const mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { id: 'user-1' } },
                    error: null,
                }),
            },
        };
        jest.mocked(createBackendClient).mockResolvedValue(
            mockSupabase as unknown as SupabaseClient,
        );
        jest.mocked(runFullDatabaseSeed).mockImplementation(async (authorizeWrite) => {
            await authorizeWrite?.();
            return { success: true };
        });
        jest.mocked(service.addSales).mockImplementation(async (_supabase, authorizeWrite) => {
            await authorizeWrite?.();
            return { message: 'Success', success: true };
        });
    });

    afterAll(() => {
        env.NODE_ENV = originalNodeEnv;
        env.FORCE_PRODUCTION = originalForceProduction;
        env.NEXT_PUBLIC_SUPABASE_DB_URL = originalDatabaseUrl;
        env.DEV_TOOLS_ALLOWED_SUPABASE_URL = originalAllowedDatabaseUrl;
    });

    describe('systemCommandAction', () => {
        it('should return unauthorized if NODE_ENV is production', async () => {
            env.NODE_ENV = 'production';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools are only available when running npm run dev.',
                success: false,
            });
            expect(queueDevToolsAuditEvent).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                { operation: 'dev_tools', reason: 'dev_tools_disabled' },
            );
            expect(processDevToolsAuditOutbox).toHaveBeenCalledTimes(1);
        });

        it('should reject commands outside development mode', async () => {
            env.NODE_ENV = 'test';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('only available when running npm run dev');
            expect(createAdminClient).not.toHaveBeenCalled();
            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
        });

        it('should log when a rejected access event cannot be queued', async () => {
            env.NODE_ENV = 'production';
            jest.mocked(queueDevToolsAuditEvent).mockRejectedValueOnce(
                new Error('audit storage unavailable'),
            );
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result.success).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Failed to queue rejected DevTools access attempt.',
                expect.any(Error),
            );
            consoleErrorSpy.mockRestore();
        });

        it('should return unauthorized if FORCE_PRODUCTION is true', async () => {
            env.FORCE_PRODUCTION = 'true';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools are only available when running npm run dev.',
                success: false,
            });
        });

        it('should fall back to IP identifier when session verification throws an error', async () => {
            jest.mocked(createBackendClient).mockRejectedValueOnce(new Error('Session error'));
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    return { message: 'Success', success: true };
                },
            );
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(mockedVerifyRateLimit).toHaveBeenCalledWith(
                expect.objectContaining({
                    identifiers: ['ip:203.0.113.1'],
                }),
            );
        });

        it('should return rate limit error if rate limit is exceeded', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: 'Unauthorized: Dev tools execution rate limit exceeded.',
            });
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    return { message: 'Success', success: true };
                },
            );

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools execution rate limit exceeded.',
                success: false,
            });
            expect(service.addSales).toHaveBeenCalledTimes(1);
            expect(queueDevToolsAuditEvent).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-1',
                { operation: 'dev_tools', reason: 'rate_limit_exceeded' },
            );
        });

        it('should audit a failed rate-limit check', async () => {
            mockedVerifyRateLimit.mockRejectedValueOnce(new Error('Rate limiter unavailable'));
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    return { message: 'Success', success: true };
                },
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Rate limiter unavailable', success: false });
            expect(queueDevToolsAuditEvent).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-1',
                { operation: 'dev_tools', reason: 'rate_limit_check_failed' },
            );
        });

        it('should fallback to default rate limit message when error is undefined', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: undefined,
            });
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    return { message: 'Success', success: true };
                },
            );

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools execution rate limit exceeded.',
                success: false,
            });
        });

        it('should return unknown command error if command is not in registry', async () => {
            const formData = new FormData();
            formData.append('command', 'unknown_cmd');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unknown Command: unknown_cmd',
                success: false,
            });
        });

        it('should reject a command value that is not a string', async () => {
            const formData = new FormData();
            formData.append('command', new Blob(['add_sales']));

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'A valid command is required.', success: false });
            expect(createAdminClient).not.toHaveBeenCalled();
            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
        });

        it('should use only the IP identifier when there is no authenticated user', async () => {
            jest.mocked(createBackendClient).mockResolvedValueOnce({
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: null,
                    }),
                },
            } as unknown as SupabaseClient);
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    return { message: 'Success', success: true };
                },
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result.success).toBe(true);
            expect(mockedVerifyRateLimit).toHaveBeenCalledWith(
                expect.objectContaining({ identifiers: ['ip:203.0.113.1'] }),
            );
        });

        it('should execute command successfully and revalidate path', async () => {
            const writeSequence: string[] = [];
            jest.mocked(persistDevToolsAuditIntent).mockImplementationOnce(async () => {
                writeSequence.push('audit-intent');
                return 'audit-intent-1';
            });
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    await authorizeWrite?.();
                    writeSequence.push('database-mutation');
                    return { message: 'Success', success: true };
                },
            );
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(writeSequence).toEqual(['audit-intent', 'database-mutation']);
            expect(mockedVerifyRateLimit).toHaveBeenCalledTimes(1);
            expect(revalidatePath).toHaveBeenCalledWith('/');
            expect(runFullDatabaseSeed).not.toHaveBeenCalled();
            expect(persistDevToolsAuditIntent).toHaveBeenCalledWith('ADMIN_ACTION', 'user-1', {
                operation: 'system_command',
                command: 'add_sales',
                phase: 'intent',
            });
            expect(completeDevToolsAuditIntent).toHaveBeenCalledWith(
                'audit-intent-1',
                expect.objectContaining({
                    operation: 'system_command',
                    command: 'add_sales',
                    phase: 'outcome',
                    outcome: 'success',
                }),
            );
            expect(processDevToolsAuditOutbox).toHaveBeenCalledTimes(1);
            expect(
                jest.mocked(processDevToolsAuditOutbox).mock.invocationCallOrder[0],
            ).toBeGreaterThan(
                jest.mocked(completeDevToolsAuditIntent).mock.invocationCallOrder[0],
            );
        });

        it('should preserve command success when opportunistic outbox processing fails', async () => {
            jest.mocked(processDevToolsAuditOutbox).mockRejectedValueOnce(
                new Error('audit delivery unavailable'),
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Failed to process DevTools audit outbox.',
                expect.any(Error),
            );
            consoleErrorSpy.mockRestore();
        });

        it('should preserve command success when queuing its outcome fails', async () => {
            jest.mocked(completeDevToolsAuditIntent).mockRejectedValueOnce(
                new Error('audit storage unavailable'),
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Failed to queue DevTools action outcome.',
                expect.any(Error),
            );
            consoleErrorSpy.mockRestore();
        });

        it('should block command writes when the durable intent cannot be stored', async () => {
            const mutation = jest.fn();
            jest.mocked(persistDevToolsAuditIntent).mockRejectedValueOnce(
                new Error('DevTools audit intent could not be stored'),
            );
            jest.mocked(service.addSales).mockImplementationOnce(
                async (_supabase, authorizeWrite) => {
                    await authorizeWrite?.();
                    mutation();
                    return { message: 'Success', success: true };
                },
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'DevTools audit intent could not be stored',
                success: false,
            });
            expect(mutation).not.toHaveBeenCalled();
            expect(completeDevToolsAuditIntent).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should audit a command handler failure response', async () => {
            jest.mocked(service.addSales).mockResolvedValueOnce({
                message: 'Seed failed',
                success: false,
            });
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Seed failed', success: false });
            expect(queueDevToolsAuditEvent).toHaveBeenCalledWith(
                'ADMIN_ACTION',
                null,
                expect.objectContaining({
                    operation: 'system_command',
                    command: 'add_sales',
                    outcome: 'failure',
                }),
            );
        });

        it('should not rate limit an invalid command', async () => {
            const formData = new FormData();
            formData.append('command', 'invalid');

            await systemCommandAction(initialCommandResponse, formData);

            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
            expect(createAdminClient).not.toHaveBeenCalled();
        });

        it('should block a command when the allowed development database is not configured', async () => {
            delete env.DEV_TOOLS_ALLOWED_SUPABASE_URL;
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message:
                    'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.',
                success: false,
            });
            expect(createAdminClient).not.toHaveBeenCalled();
            expect(service.addSales).not.toHaveBeenCalled();
        });

        it('should block a command when the active database differs from the allowed target', async () => {
            env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://development-project.supabase.co';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('intended development database');
            expect(createAdminClient).not.toHaveBeenCalled();
            expect(service.addSales).not.toHaveBeenCalled();
        });

        it('should catch Error and return its message', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce(new Error('Custom service error'));
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Custom service error', success: false });
            expect(queueDevToolsAuditEvent).toHaveBeenCalledWith(
                'ADMIN_ACTION',
                null,
                expect.objectContaining({
                    operation: 'system_command',
                    command: 'add_sales',
                    outcome: 'failure',
                }),
            );
        });

        it('should not rate limit when command preflight fails before the write gate', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce(
                new Error('Preflight lookup failed'),
            );
            jest.mocked(createAdminClient).mockResolvedValueOnce({} as SupabaseClient);
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Preflight lookup failed', success: false });
            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
        });

        it('should catch non-Error and fallback to Operation Failed message', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce('string error');
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Operation Failed', success: false });
        });
    });

    describe('fullResetAction', () => {
        const initialResetResponse: service.CommandResponse = { message: '', success: false };

        it('should return unauthorized if NODE_ENV is production', async () => {
            env.NODE_ENV = 'production';
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools are only available when running npm run dev.',
                success: false,
            });
        });

        it('should reject resets outside development mode', async () => {
            env.NODE_ENV = 'test';
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('only available when running npm run dev');
            expect(runFullDatabaseSeed).not.toHaveBeenCalled();
            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
        });

        it('should return unauthorized if FORCE_PRODUCTION is true', async () => {
            env.FORCE_PRODUCTION = 'true';
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools are only available when running npm run dev.',
                success: false,
            });
        });

        it('should return rate limit error if rate limit is exceeded', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: 'Unauthorized: Dev tools execution rate limit exceeded.',
            });

            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({
                message: 'Reset Failed: Unauthorized: Dev tools execution rate limit exceeded.',
                success: false,
            });
            expect(runFullDatabaseSeed).toHaveBeenCalledTimes(1);
        });

        it('should successfully run full reset and revalidate path', async () => {
            jest.mocked(runFullDatabaseSeed).mockImplementationOnce(async (authorizeWrite) => {
                await authorizeWrite?.();
                return { success: true };
            });
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({ message: 'Full Reset Complete', success: true });
            expect(runFullDatabaseSeed).toHaveBeenCalled();
            expect(mockedVerifyRateLimit).toHaveBeenCalledTimes(1);
            expect(revalidatePath).toHaveBeenCalledWith('/');
            expect(persistDevToolsAuditIntent).toHaveBeenCalledWith('ADMIN_ACTION', 'user-1', {
                operation: 'full_reset',
                phase: 'intent',
            });
            expect(completeDevToolsAuditIntent).toHaveBeenCalledWith(
                'audit-intent-1',
                expect.objectContaining({
                    operation: 'full_reset',
                    phase: 'outcome',
                    outcome: 'success',
                }),
            );
        });

        it('should block a reset when the active database differs from the allowed target', async () => {
            env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://development-project.supabase.co';
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('intended development database');
            expect(runFullDatabaseSeed).not.toHaveBeenCalled();
        });

        it('should return Reset Failed if running seed throws an error', async () => {
            jest.mocked(runFullDatabaseSeed).mockImplementationOnce(async (authorizeWrite) => {
                await authorizeWrite?.();
                throw new Error('Seed failed');
            });
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({ message: 'Reset Failed: Seed failed', success: false });
            expect(completeDevToolsAuditIntent).toHaveBeenCalledWith(
                'audit-intent-1',
                expect.objectContaining({
                    operation: 'full_reset',
                    phase: 'outcome',
                    outcome: 'failure',
                }),
            );
        });

        it('should use the fallback message when reset throws a non-Error value', async () => {
            jest.mocked(runFullDatabaseSeed).mockRejectedValueOnce('unexpected failure');

            const result = await fullResetAction(
                initialResetResponse,
                new FormData(),
            );

            expect(result).toEqual({ message: 'Reset Failed: Operation Failed', success: false });
        });

        it('should not rate limit a reset when the database target is invalid', async () => {
            env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://other-project.supabase.co';
            const formData = new FormData();

            await fullResetAction(initialResetResponse, formData);

            expect(mockedVerifyRateLimit).not.toHaveBeenCalled();
            expect(runFullDatabaseSeed).not.toHaveBeenCalled();
        });
    });
});
