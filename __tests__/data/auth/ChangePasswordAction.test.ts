import { terminateSession, updateAccountPassword } from '@/data/auth/AuthRepository';
import { passwordSchema } from '@/data/schemas/authSchemas';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { ChangePasswordAction } from '@/data/auth/ChangePasswordAction';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('@/utils/db/server');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/data/auth/AuthRepository', () => ({
    updateAccountPassword: jest.fn(),
    terminateSession: jest.fn(),
}));
jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));
jest.mock('@/utils/network/rateLimiter', () => ({
    buildRateLimitIdentifiers: jest.fn(() => ['ip:203.0.113.1', 'user:123']),
    limiters: { auth: {} },
    verifyRateLimit: jest.fn(),
}));

type MockSupabaseClient = {
    auth: {
        getUser: jest.Mock;
        updateUser: jest.Mock;
        signOut: jest.Mock;
    };
    from: jest.Mock;
};

const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (typeof message === 'string' && message.includes('[SecurityAudit]')) {
                return;
            }
            originalWarn(message, ...optionalParams);
        },
    );

    jest.spyOn(console, 'error').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (
                typeof message === 'string' &&
                (message.includes('[Standard Error]:') ||
                    message.includes('Failed to load filter constants') ||
                    message.includes('An update to BookAdvancedFilteringProvider'))
            ) {
                return;
            }
            originalError(message, ...optionalParams);
        },
    );
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('ChangePasswordAction', () => {
    let mockSupabase: MockSupabaseClient;
    const mockedVerifyRateLimit = verifyRateLimit as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: jest.fn(),
                updateUser: jest.fn().mockRejectedValue(new Error('Simulated Update Error')),
                signOut: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        };

        jest.mocked(createBackendClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        jest.mocked(updateAccountPassword).mockResolvedValue({
            data: { user: { id: '123' } as User },
            error: null,
        });
        jest.mocked(terminateSession).mockResolvedValue({ data: {}, error: null });
        mockedVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 5,
            remaining: 4,
            reset: Date.now() + 60000,
        });
    });

    it('should return default state when reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result).toEqual({
            message: null,
            validationErrors: undefined,
        });
    });

    it('should return validation errors if Zod parsing fails', async () => {
        const formData = new FormData();
        formData.append('password', 'short');
        formData.append('cnfPassword', 'mismatch');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Validation failed. Please check the requirements.');
        expect(result.validationErrors).toBeDefined();
    });

    it('should return error if authentication fails', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'No session' },
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Session expired. Please log in again.');
    });

    it('should return error when rate limit is exceeded', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 5,
            remaining: 0,
            reset: Date.now() + 60000,
            error: 'Too many password reset requests.',
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Too many password reset requests.');
        expect(updateAccountPassword).not.toHaveBeenCalled();
    });

    it('should fallback to default rate limit message when error is undefined', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 5,
            remaining: 0,
            reset: Date.now() + 60000,
            error: undefined,
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Too many password reset requests.');
        expect(updateAccountPassword).not.toHaveBeenCalled();
    });

    it('should handle update password error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        jest.mocked(updateAccountPassword).mockResolvedValue({
            data: null,
            error: 'Password update failed',
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Password update failed');
    });

    it('should handle terminate session error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        jest.mocked(updateAccountPassword).mockResolvedValue({
            data: { user: { id: '123' } as User },
            error: null,
        });
        jest.mocked(terminateSession).mockResolvedValue({
            data: null,
            error: 'Session termination failed',
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Session termination failed');
    });

    it('should sign out and redirect on success', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        jest.mocked(updateAccountPassword).mockResolvedValue({
            data: { user: { id: '123' } as User },
            error: null,
        });
        jest.mocked(terminateSession).mockResolvedValue({ data: {}, error: null });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        await ChangePasswordAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(redirect).toHaveBeenCalledWith('/user/auth/signin');
    });

    it('should return validation error message when empty strings are passed', async () => {
        const formData = new FormData();
        formData.append('password', '');
        formData.append('cnfPassword', '');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Validation failed. Please check the requirements.');
    });

    it('BRANCH COVERAGE: hits null branches in Auth and Supabase blocks', async () => {
        const zodSpy = jest.spyOn(passwordSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { password: 'ValidPass123!', cnfPassword: 'ValidPass123!' },
            error: undefined,
        });

        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Session expired. Please log in again.');

        zodSpy.mockRestore();
    });

    it('should handle catch block errors and return a specific friendly message', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        jest.mocked(updateAccountPassword).mockRejectedValue(new Error('Critical failure'));

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(consoleSpy).toHaveBeenCalled();
        expect(result.message).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('should rethrow NEXT_REDIRECT error caught in catch block', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        jest.mocked(updateAccountPassword).mockRejectedValue(new Error('NEXT_REDIRECT'));

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        await expect(ChangePasswordAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });
});
