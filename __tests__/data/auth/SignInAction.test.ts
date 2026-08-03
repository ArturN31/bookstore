import { SignInAction } from '@/data/auth/SignInAction';
import { signInSchema } from '@/data/schemas/authSchemas';
import { getUserData } from '@/data/user/UserService';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserService');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

type MockSupabaseClient = {
    auth: {
        signInWithPassword: jest.Mock;
    };
};

describe('APP - Auth - SignInAction', () => {
    let mockSupabase: MockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockSupabase = {
            auth: {
                signInWithPassword: jest.fn(),
            },
        };
        jest.mocked(createBackendClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
    });

    afterEach(() => {
        (console.error as jest.Mock<unknown, unknown[]>).mockRestore();
        (console.warn as jest.Mock<unknown, unknown[]>).mockRestore();
    });

    it('should return reset state when rawData.reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await SignInAction(undefined, formData);

        expect(result).toEqual({
            message: null,
            validationErrors: undefined,
        });
    });

    it('should return validation errors when input is invalid', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', '123');

        const result = await SignInAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please correct the highlighted errors.');
    });

    it('should return null for email and password if they are missing from formData', async () => {
        const formData = new FormData();
        const result = await SignInAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
    });

    it('should cover the nullish fallback for email and password inside the authError block', async () => {
        const spy = jest.spyOn(signInSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { email: 'mock@test.com', password: 'Password123!' },
        } as ReturnType<typeof signInSchema.safeParse>);

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            error: { code: 'invalid_credentials' },
        });

        const formData = new FormData();
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBeDefined();

        spy.mockRestore();
    });

    it('should handle authError when the code property is missing', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            error: {
                message: 'A direct message from Supabase',
            },
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBe('A direct message from Supabase');
    });

    it('should return error message when sign in fails via Supabase', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            error: { code: 'invalid_credentials', message: 'Auth failed' },
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBeDefined();
    });

    it('should return default fallback error message when auth error code/message are missing', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            error: {
                code: 'unknown_code_999',
                message: '',
            },
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBeDefined();
    });

    it('should redirect to profile if user data is missing', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        jest.mocked(getUserData).mockResolvedValue({
            data: null,
            error: null,
        } as unknown as Awaited<ReturnType<typeof getUserData>>);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        await SignInAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should redirect to returnTo URL if valid', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        jest.mocked(getUserData).mockResolvedValue({
            data: { id: '123' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof getUserData>>);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');
        formData.append('returnTo', '/user/account');

        await SignInAction(undefined, formData);

        expect(redirect).toHaveBeenCalledWith('/user/account');
    });

    it('should redirect to home by default if user exists and no returnTo provided', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        jest.mocked(getUserData).mockResolvedValue({
            data: { id: '123' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof getUserData>>);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        await SignInAction(undefined, formData);

        expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should handle critical server error in catch block', async () => {
        jest.mocked(createBackendClient).mockRejectedValueOnce(new Error('Critical failure'));

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBe('An unexpected error occurred. We are looking into it.');
        expect(console.error).toHaveBeenCalledWith(
            '[SignInAction] Critical Failure:',
            expect.any(Error),
        );
    });

    it('should re-throw redirect errors', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        jest.mocked(getUserData).mockResolvedValue({
            data: { id: '123' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof getUserData>>);

        const redirectError = new Error('NEXT_REDIRECT');

        jest.mocked(redirect).mockImplementation(() => {
            throw redirectError;
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('captchaToken', 'mocked-test-token');

        await expect(SignInAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('BRANCH COVERAGE: should return security token error message if captchaToken is completely missing from formData', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBe(
            'Authentication rejected due to an invalid or missing security token.',
        );
        expect(result.validationErrors).toBeUndefined();
    });
});
