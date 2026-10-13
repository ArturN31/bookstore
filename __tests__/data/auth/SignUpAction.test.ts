import { registerUser } from '@/data/auth/AuthRepository';
import { SignUpAction } from '@/data/auth/SignUpAction';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('@/utils/db/server');
jest.mock('@/data/auth/AuthRepository');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));
jest.mock('@/utils/network/rateLimiter', () => ({
    buildRateLimitIdentifiers: jest.fn(() => ['ip:203.0.113.1', 'email:test@example.com']),
    limiters: { auth: {} },
    verifyRateLimit: jest.fn(),
}));

describe('APP - Auth - SignUpAction', () => {
    const mockedVerifyRateLimit = verifyRateLimit as jest.Mock;

    beforeAll(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createBackendClient).mockResolvedValue(
            {} as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        mockedVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 5,
            remaining: 4,
            reset: Date.now() + 60000,
        });
    });

    it('should return reset state when rawData.reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await SignUpAction(undefined, formData);

        expect(result).toEqual({
            message: null,
            validationErrors: undefined,
        });
    });

    it('should return validation errors when input is invalid', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', '123');

        const result = await SignUpAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please resolve the validation errors.');
    });

    it('should return error message when rate limit is exceeded', async () => {
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 5,
            remaining: 0,
            reset: Date.now() + 60000,
            error: 'Too many account registration attempts. Please try again later.',
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe(
            'Too many account registration attempts. Please try again later.',
        );
        expect(registerUser).not.toHaveBeenCalled();
    });

    it('should fallback to default rate limit error message when error is undefined', async () => {
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 5,
            remaining: 0,
            reset: Date.now() + 60000,
            error: undefined,
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe(
            'Too many account registration attempts. Please try again later.',
        );
        expect(registerUser).not.toHaveBeenCalled();
    });

    it('should return security token error message if captchaToken is missing', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe(
            'Registration rejected due to an invalid or missing security token.',
        );
        expect(result.validationErrors).toBeUndefined();
    });

    it('should return mapped error message when registerUser returns an error', async () => {
        jest.mocked(registerUser).mockResolvedValue({
            data: undefined,
            error: 'User already registered',
        } as unknown as Awaited<ReturnType<typeof registerUser>>);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('User already registered');
        expect(result.validationErrors).toBeUndefined();
    });

    it('should revalidate paths and redirect to profile on success', async () => {
        jest.mocked(registerUser).mockResolvedValue({
            data: { user: null, session: null },
            error: undefined,
        } as unknown as Awaited<ReturnType<typeof registerUser>>);

        const formData = new FormData();
        formData.append('email', 'newuser@example.com');
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');
        formData.append('captchaToken', 'mocked-test-token');

        await SignUpAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should handle critical server error in catch block', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const criticalError = new Error('Database explosion');
        jest.mocked(createBackendClient).mockRejectedValueOnce(criticalError);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBeDefined();
        expect(consoleSpy).toHaveBeenCalledWith('[SignUpAction] Critical Failure:', criticalError);
    });

    it('should re-throw NEXT_REDIRECT error caught inside try block', async () => {
        const redirectError = new Error('NEXT_REDIRECT');
        jest.mocked(createBackendClient).mockRejectedValueOnce(redirectError);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        await expect(SignUpAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle non-Error thrown inside try block in catch', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        jest.mocked(createBackendClient).mockRejectedValueOnce('Non-error string failure');

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('Non-error string failure');
        expect(consoleSpy).toHaveBeenCalledWith(
            '[SignUpAction] Critical Failure:',
            'Non-error string failure',
        );
    });

    it('should re-throw redirect errors from redirect call outside try block', async () => {
        jest.mocked(registerUser).mockResolvedValue({
            data: { user: null, session: null },
            error: undefined,
        } as unknown as Awaited<ReturnType<typeof registerUser>>);

        const redirectError = new Error('NEXT_REDIRECT');

        jest.mocked(redirect).mockImplementation(() => {
            throw redirectError;
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        await expect(SignUpAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });
});
