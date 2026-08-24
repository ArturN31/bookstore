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

describe('DevToolsActions', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalForceProduction = process.env.FORCE_PRODUCTION;
    const env = process.env as Record<string, string | undefined>;

    const initialCommandResponse: service.CommandResponse = { message: '', success: false };

    beforeEach(() => {
        jest.clearAllMocks();
        env.NODE_ENV = 'development';
        delete env.FORCE_PRODUCTION;
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
            const mockSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Success', success: true });
            expect(revalidatePath).toHaveBeenCalledWith('/');
        });

        it('should catch Error and return its message', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce(new Error('Custom service error'));
            const mockSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockSupabase);

            const formData = new FormData();
            formData.append('command', 'add_sales');

            const result = await systemCommandAction(initialCommandResponse, formData);

            expect(result).toEqual({ message: 'Custom service error', success: false });
        });

        it('should catch non-Error and fallback to Operation Failed message', async () => {
            jest.mocked(service.addSales).mockRejectedValueOnce('string error');
            const mockSupabase = {} as unknown as SupabaseClient;
            jest.mocked(createAdminClient).mockResolvedValueOnce(mockSupabase);

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
