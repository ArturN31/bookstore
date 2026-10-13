import {
    systemCommandAction,
    fullResetAction,
    impulseLogin,
} from '@/app/dev-tools/actions/DevToolsActions';
import * as service from '@/app/dev-tools/actions/DevToolsService';
import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

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

describe('DevToolsActions', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalForceProduction = process.env.FORCE_PRODUCTION;
    const env = process.env as Record<string, string | undefined>;
    const mockedVerifyRateLimit = verifyRateLimit as jest.Mock;

    const initialCommandResponse: service.CommandResponse = { message: '', success: false };

    beforeEach(() => {
        jest.clearAllMocks();
        env.NODE_ENV = 'development';
        delete env.FORCE_PRODUCTION;

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
    });

    afterAll(() => {
        env.NODE_ENV = originalNodeEnv;
        env.FORCE_PRODUCTION = originalForceProduction;
    });

    describe('systemCommandAction', () => {
        it('should return unauthorized if NODE_ENV is production', async () => {
            env.NODE_ENV = 'production';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Command rejected in production.',
                success: false,
            });
        });

        it('should return unauthorized if FORCE_PRODUCTION is true', async () => {
            env.FORCE_PRODUCTION = 'true';
            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Command rejected in production.',
                success: false,
            });
        });

        it('should fall back to IP identifier when session verification throws an error', async () => {
            jest.mocked(createBackendClient).mockRejectedValueOnce(new Error('Session error'));
            jest.mocked(service.addSales).mockResolvedValueOnce({
                message: 'Success',
                success: true,
            });
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

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({
                message: 'Unauthorized: Dev tools execution rate limit exceeded.',
                success: false,
            });
            expect(service.addSales).not.toHaveBeenCalled();
        });

        it('should fallback to default rate limit message when error is undefined', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: undefined,
            });

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

        it('should execute command successfully and revalidate path', async () => {
            jest.mocked(service.addSales).mockResolvedValueOnce({
                message: 'Success',
                success: true,
            });
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(revalidatePath).toHaveBeenCalledWith('/');
        });

        it('should catch Error and return its message', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce(new Error('Custom service error'));
            const mockAdminSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockAdminSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Custom service error', success: false });
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

            expect(result).toEqual({ message: 'Unauthorized', success: false });
        });

        it('should return unauthorized if FORCE_PRODUCTION is true', async () => {
            env.FORCE_PRODUCTION = 'true';
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({ message: 'Unauthorized', success: false });
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
                message: 'Unauthorized: Dev tools execution rate limit exceeded.',
                success: false,
            });
            expect(runFullDatabaseSeed).not.toHaveBeenCalled();
        });

        it('should successfully run full reset and revalidate path', async () => {
            jest.mocked(runFullDatabaseSeed).mockResolvedValueOnce({ success: true });
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({ message: 'Full Reset Complete', success: true });
            expect(runFullDatabaseSeed).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/');
        });

        it('should return Reset Failed if running seed throws an error', async () => {
            jest.mocked(runFullDatabaseSeed).mockRejectedValueOnce(new Error('Seed failed'));
            const formData = new FormData();

            const result = await fullResetAction(initialResetResponse, formData);

            expect(result).toEqual({ message: 'Reset Failed', success: false });
        });
    });

    describe('impulseLogin', () => {
        it('should throw an error if NODE_ENV is production', async () => {
            env.NODE_ENV = 'production';

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'Unauthorized: Dev tools are unavailable in production.',
            );
        });

        it('should throw an error if FORCE_PRODUCTION is true', async () => {
            env.FORCE_PRODUCTION = 'true';

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'Unauthorized: Dev tools are unavailable in production.',
            );
        });

        it('should throw an error if rate limit is exceeded', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: 'Unauthorized: Dev tools impulse login rate limit exceeded.',
            });

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'Unauthorized: Dev tools impulse login rate limit exceeded.',
            );
            expect(createAdminClient).not.toHaveBeenCalled();
        });

        it('should fallback to default rate limit message when error is undefined', async () => {
            mockedVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
                error: undefined,
            });

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'Unauthorized: Dev tools impulse login rate limit exceeded.',
            );
        });

        it('should successfully login user', async () => {
            const mockAdminClient = {
                auth: {
                    admin: {
                        listUsers: jest.fn().mockResolvedValue({
                            data: { users: [{ id: 'user-1', email: 'test@example.com' }] },
                            error: null,
                        }),
                        updateUserById: jest.fn().mockResolvedValue({ error: null }),
                    },
                },
            };

            const mockBackendClient = {
                auth: {
                    signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
                },
            };

            jest.mocked(createAdminClient).mockResolvedValueOnce(
                mockAdminClient as unknown as SupabaseClient,
            );
            jest.mocked(createBackendClient).mockResolvedValueOnce(
                mockBackendClient as unknown as SupabaseClient,
            );

            const result = await impulseLogin('test@example.com');
            expect(result).toEqual({ success: true });
            expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
                password: 'DevTempPassword123!',
            });
            expect(mockBackendClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'DevTempPassword123!',
            });
        });

        it('should throw an error if admin listUsers returns an error', async () => {
            const mockAdminClient = {
                auth: {
                    admin: {
                        listUsers: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Database failure' },
                        }),
                        updateUserById: jest.fn(),
                    },
                },
            };

            const mockBackendClient = {};

            jest.mocked(createAdminClient).mockResolvedValueOnce(
                mockAdminClient as unknown as SupabaseClient,
            );
            jest.mocked(createBackendClient).mockResolvedValueOnce(
                mockBackendClient as unknown as SupabaseClient,
            );

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'LIST_USERS_FAILED: Database failure',
            );
        });

        it('should throw an error if user is not found in the user list', async () => {
            const mockAdminClient = {
                auth: {
                    admin: {
                        listUsers: jest.fn().mockResolvedValue({
                            data: { users: [{ id: 'user-1', email: 'other@example.com' }] },
                            error: null,
                        }),
                        updateUserById: jest.fn(),
                    },
                },
            };

            const mockBackendClient = {};

            jest.mocked(createAdminClient).mockResolvedValueOnce(
                mockAdminClient as unknown as SupabaseClient,
            );
            jest.mocked(createBackendClient).mockResolvedValueOnce(
                mockBackendClient as unknown as SupabaseClient,
            );

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'USER_NOT_FOUND: No user found with email test@example.com',
            );
        });

        it('should throw an error if admin updateUserById fails', async () => {
            const mockAdminClient = {
                auth: {
                    admin: {
                        listUsers: jest.fn().mockResolvedValue({
                            data: { users: [{ id: 'user-1', email: 'test@example.com' }] },
                            error: null,
                        }),
                        updateUserById: jest
                            .fn()
                            .mockResolvedValue({ error: { message: 'Update failed' } }),
                    },
                },
            };

            const mockBackendClient = {};

            jest.mocked(createAdminClient).mockResolvedValueOnce(
                mockAdminClient as unknown as SupabaseClient,
            );
            jest.mocked(createBackendClient).mockResolvedValueOnce(
                mockBackendClient as unknown as SupabaseClient,
            );

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'ADMIN_UPDATE_FAILED: Update failed',
            );
        });

        it('should throw an error if signInWithPassword fails', async () => {
            const mockAdminClient = {
                auth: {
                    admin: {
                        listUsers: jest.fn().mockResolvedValue({
                            data: { users: [{ id: 'user-1', email: 'test@example.com' }] },
                            error: null,
                        }),
                        updateUserById: jest.fn().mockResolvedValue({ error: null }),
                    },
                },
            };

            const mockBackendClient = {
                auth: {
                    signInWithPassword: jest
                        .fn()
                        .mockResolvedValue({ error: { message: 'Sign in failed' } }),
                },
            };

            jest.mocked(createAdminClient).mockResolvedValueOnce(
                mockAdminClient as unknown as SupabaseClient,
            );
            jest.mocked(createBackendClient).mockResolvedValueOnce(
                mockBackendClient as unknown as SupabaseClient,
            );

            await expect(impulseLogin('test@example.com')).rejects.toThrow(
                'SIGN_IN_FAILED: Sign in failed',
            );
        });
    });
});
