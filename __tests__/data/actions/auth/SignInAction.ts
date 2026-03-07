import { SignInAction } from '@/data/actions/auth/SignInAction';
import { signInSchema } from '@/data/schemas/authSchemas';
import { getUserData } from '@/data/user/GetUserData';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/GetUserData');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('APP - Auth - SignIn', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                signInWithPassword: jest.fn(),
            },
        };
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return reset state when rawData.reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await SignInAction(undefined, formData);

        expect(result).toEqual({
            email: '',
            password: '',
            message: undefined,
            error: undefined,
            validationErrors: undefined,
        });
    });

    it('should return validation errors when input is invalid', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', '123');

        const result = await SignInAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please correct the errors below.');
        expect(result.email).toBe('');
    });

    it('should return null for email and password if they are missing from formData', async () => {
        const formData = new FormData();
        const result = await SignInAction(undefined, formData);

        expect(result.email).toBe('');
        expect(result.password).toBe('');
        expect(result.validationErrors).toBeDefined();
    });

    it('should cover the nullish fallback for email and password inside the authError block', async () => {
        const spy = jest.spyOn(signInSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { email: 'mock@test.com', password: 'Password123!' },
        } as any);

        mockSupabase.auth.signInWithPassword.mockResolvedValue({
            error: { code: 'invalid_credentials' },
        });

        const formData = new FormData();
        const result = await SignInAction(undefined, formData);

        expect(result.email).toBe('');
        expect(result.password).toBe('');
        expect(result.error).toBeDefined();

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

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBe('Sign in credentials not recognized.');
        expect(result.error).toBeDefined();
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

        const result = await SignInAction(undefined, formData);

        expect(result.message).toBe('Failed to sign in.');
    });

    it('should redirect to profile if user data is missing', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        (getUserData as jest.Mock).mockResolvedValue(null);

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');

        await SignInAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should redirect to returnTo URL if valid', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        (getUserData as jest.Mock).mockResolvedValue({ id: '123' });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('returnTo', '/dashboard');

        await SignInAction(undefined, formData);

        expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should redirect to home by default if user exists and no returnTo provided', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
        (getUserData as jest.Mock).mockResolvedValue({ id: '123' });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');

        await SignInAction(undefined, formData);

        expect(redirect).toHaveBeenCalledWith('/');
    });
});
