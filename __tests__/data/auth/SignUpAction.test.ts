import { registerUser } from '@/data/auth/AuthRepository';
import { SignUpAction } from '@/data/auth/SignUpAction';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('@/data/auth/AuthRepository');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('APP - Auth - SignUpAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createBackendClient).mockResolvedValue(
            {} as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
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
            data: null,
            error: 'User already registered',
        });

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
            error: null,
        });

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
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.mocked(createBackendClient).mockRejectedValueOnce(new Error('Database explosion'));

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('An unexpected error occurred. We are looking into it.');
        expect(consoleSpy).toHaveBeenCalledWith(
            '[SignUpAction] Critical Failure:',
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });

    it('should re-throw redirect errors', async () => {
        jest.mocked(registerUser).mockResolvedValue({
            data: { user: null, session: null },
            error: null,
        });

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
