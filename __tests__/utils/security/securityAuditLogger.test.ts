// __tests__/utils/security/securityAuditLogger.test.ts
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { createAdminClient } from '@/utils/db/admin';
import { headers } from 'next/headers';

let activeAfterPromise: Promise<void> | null = null;
let customAfterImplementation: ((callback: () => void | Promise<void>) => void) | undefined =
    jest.fn((callback: () => void | Promise<void>) => {
        const res = callback();
        if (res instanceof Promise) {
            activeAfterPromise = res.then(() => {});
        } else {
            activeAfterPromise = Promise.resolve();
        }
    });

let shouldThrowInNextServer = false;

jest.mock('next/server', () => ({
    get after() {
        if (shouldThrowInNextServer) {
            throw new Error('Simulated import failure');
        }
        return customAfterImplementation;
    },
}));

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
    headers: jest.fn(),
}));

const flushMicrotasks = async (): Promise<void> => {
    if (activeAfterPromise) {
        await activeAfterPromise;
    }
    await Promise.resolve();
    await Promise.resolve();
};

describe('securityAuditLogger', () => {
    const mockInsert = jest.fn();
    const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabaseAdmin = { from: mockFrom };

    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        activeAfterPromise = null;
        shouldThrowInNextServer = false;
        customAfterImplementation = jest.fn((callback: () => void | Promise<void>) => {
            const res = callback();
            if (res instanceof Promise) {
                activeAfterPromise = res.then(() => {});
            } else {
                activeAfterPromise = Promise.resolve();
            }
        });

        (createAdminClient as jest.MockedFunction<typeof createAdminClient>).mockResolvedValue(
            mockSupabaseAdmin as unknown as Awaited<ReturnType<typeof createAdminClient>>,
        );
        mockInsert.mockResolvedValue({ error: null });

        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((): void => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((): void => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('environment and execution fallbacks', () => {
        it('should warn and return early if process is undefined (client environment)', async () => {
            const globalRef = global as unknown as Record<string, unknown>;
            const originalProcess = globalRef.process;
            delete globalRef.process;

            try {
                await recordSecurityAuditLog('SUCCESSFUL_LOGIN', 'user-123', {});
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    '[SecurityAudit] Attempted to run security logger on the client.',
                );
            } finally {
                globalRef.process = originalProcess;
            }
        });

        it('should execute logging directly via fallback when after is not available', async () => {
            customAfterImplementation = undefined;
            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
                'user-agent': 'Agent',
            });

            await recordSecurityAuditLog('SUCCESSFUL_LOGIN', 'user-123', {}, requestHeaders);
            await flushMicrotasks();

            expect(mockInsert).toHaveBeenCalled();
        });

        it('should catch errors during next/server import or check and fallback to direct execution', async () => {
            shouldThrowInNextServer = true;
            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
                'user-agent': 'Agent',
            });

            try {
                await recordSecurityAuditLog('SUCCESSFUL_LOGIN', 'user-123', {}, requestHeaders);
                await flushMicrotasks();
                expect(mockInsert).toHaveBeenCalled();
            } finally {
                shouldThrowInNextServer = false;
            }
        });
    });

    describe('metadata sanitization and enrichment', () => {
        it('should sanitize sensitive fields, Error instances, and nested objects', async () => {
            const requestHeaders = new Headers({
                'x-forwarded-for': '192.168.1.1',
                'user-agent': 'TestAgent',
            });

            const errorInstance = new Error('Test error');
            await recordSecurityAuditLog(
                'SUCCESSFUL_LOGIN',
                'user-123',
                {
                    password: 'secretPassword',
                    nested: { token: 'abc', err: errorInstance },
                },
                requestHeaders,
            );
            await flushMicrotasks();

            const insertedPayload = mockInsert.mock.calls[0][0] as {
                metadata: {
                    password: string;
                    nested: { token: string; err: string };
                };
            };

            expect(insertedPayload.metadata.password).toBe('[REDACTED]');
            expect(insertedPayload.metadata.nested.token).toBe('[REDACTED]');
            expect(insertedPayload.metadata.nested.err).toBe('Test error');
        });

        it('should handle objects with a message property', async () => {
            const requestHeaders = new Headers({
                'x-forwarded-for': '10.0.0.1',
                'user-agent': 'TestAgent',
            });

            await recordSecurityAuditLog(
                'FAILED_LOGIN',
                null,
                {
                    customObj: { message: 'Custom error message' },
                },
                requestHeaders,
            );
            await flushMicrotasks();

            const insertedPayload = mockInsert.mock.calls[0][0] as {
                metadata: { customObj: string };
            };

            expect(insertedPayload.metadata.customObj).toBe('Custom error message');
        });
    });

    describe('client IP and User-Agent extraction', () => {
        it('should extract IP from x-forwarded-for, x-real-ip, or default to unknown using requestHeaders', async () => {
            const headersWithForwarded = new Headers({
                'x-forwarded-for': '203.0.113.195, 70.41.3.18',
                'user-agent': 'Agent1',
            });
            await recordSecurityAuditLog('SUCCESSFUL_REGISTRATION', 'u1', {}, headersWithForwarded);
            await flushMicrotasks();
            expect(mockInsert.mock.calls[0][0].metadata.ip).toBe('203.0.113.195');

            const headersWithRealIp = new Headers({
                'x-real-ip': '198.51.100.14',
                'user-agent': 'Agent2',
            });
            await recordSecurityAuditLog('PASSWORD_CHANGE', 'u2', {}, headersWithRealIp);
            await flushMicrotasks();
            expect(mockInsert.mock.calls[1][0].metadata.ip).toBe('198.51.100.14');

            const headersWithNoIp = new Headers({
                'user-agent': 'Agent3',
            });
            await recordSecurityAuditLog('PASSWORD_CHANGE', 'u3', {}, headersWithNoIp);
            await flushMicrotasks();
            expect(mockInsert.mock.calls[2][0].metadata.ip).toBe('unknown');
        });

        it('should default user-agent to unknown if missing in requestHeaders', async () => {
            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
            });
            await recordSecurityAuditLog('SUCCESSFUL_LOGIN', 'u1', {}, requestHeaders);
            await flushMicrotasks();
            const insertedPayload = mockInsert.mock.calls[0][0] as {
                metadata: { userAgent: string };
            };
            expect(insertedPayload.metadata.userAgent).toBe('unknown');
        });

        it('should extract IP from x-forwarded-for, x-real-ip, or default to unknown using next/headers()', async () => {
            const mockHeaderList1 = new Headers({
                'x-forwarded-for': '12.34.56.78',
                'user-agent': 'ListAgent1',
            });
            (headers as jest.Mock).mockResolvedValueOnce(mockHeaderList1);
            await recordSecurityAuditLog('ADMIN_ACTION', 'admin-1', {});
            await flushMicrotasks();
            expect(mockInsert.mock.calls[0][0].metadata.ip).toBe('12.34.56.78');

            const mockHeaderList2 = new Headers({
                'x-real-ip': '11.22.33.44',
                'user-agent': 'ListAgent2',
            });
            (headers as jest.Mock).mockResolvedValueOnce(mockHeaderList2);
            await recordSecurityAuditLog('ADMIN_ACTION', 'admin-2', {});
            await flushMicrotasks();
            expect(mockInsert.mock.calls[1][0].metadata.ip).toBe('11.22.33.44');

            const mockHeaderList3 = new Headers({
                'user-agent': 'ListAgent3',
            });
            (headers as jest.Mock).mockResolvedValueOnce(mockHeaderList3);
            await recordSecurityAuditLog('ADMIN_ACTION', 'admin-3', {});
            await flushMicrotasks();
            expect(mockInsert.mock.calls[2][0].metadata.ip).toBe('unknown');
        });

        it('should default user-agent to unknown if missing in next/headers()', async () => {
            const mockHeaderList = new Headers({
                'x-forwarded-for': '1.1.1.1',
            });
            (headers as jest.Mock).mockResolvedValueOnce(mockHeaderList);
            await recordSecurityAuditLog('ADMIN_ACTION', 'admin-1', {});
            await flushMicrotasks();
            const insertedPayload = mockInsert.mock.calls[0][0] as {
                metadata: { userAgent: string };
            };
            expect(insertedPayload.metadata.userAgent).toBe('unknown');
        });

        it('should handle errors when calling headers() outside request context', async () => {
            (headers as jest.Mock).mockRejectedValue(new Error('Outside request context'));

            await recordSecurityAuditLog('FAILED_REGISTRATION', null, {});
            await flushMicrotasks();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Warning: recordSecurityAuditLog was called outside request context without explicit headers.',
            );
            const insertedPayload = mockInsert.mock.calls[0][0] as {
                metadata: { ip: string; userAgent: string };
            };
            expect(insertedPayload.metadata.ip).toBe('unknown');
            expect(insertedPayload.metadata.userAgent).toBe('unknown');
        });
    });

    describe('error handling during database insertion', () => {
        it('should log an error message if supabase insert returns an error', async () => {
            const dbError = { message: 'Row level security policy violation' };
            mockInsert.mockResolvedValue({ error: dbError });

            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
                'user-agent': 'Agent',
            });

            await recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {}, requestHeaders);
            await flushMicrotasks();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Failed to write security audit log to database:',
                'Row level security policy violation',
            );
        });

        it('should handle and log Error exceptions thrown inside the after block', async () => {
            (createAdminClient as jest.Mock).mockRejectedValue(
                new Error('Database client creation failed'),
            );

            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
                'user-agent': 'Agent',
            });

            await recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {}, requestHeaders);
            await flushMicrotasks();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Unexpected critical error in background audit logger:',
                'Database client creation failed',
            );
        });

        it('should handle and log non-Error exceptions thrown inside the after block', async () => {
            (createAdminClient as jest.Mock).mockRejectedValue('String database failure error');

            const requestHeaders = new Headers({
                'x-forwarded-for': '1.1.1.1',
                'user-agent': 'Agent',
            });

            await recordSecurityAuditLog('FAILED_AUTHENTICATION_ATTEMPT', null, {}, requestHeaders);
            await flushMicrotasks();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[SecurityAudit] Unexpected critical error in background audit logger:',
                'String database failure error',
            );
        });
    });
});
