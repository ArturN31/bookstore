import { SignUpAction } from '@/data/actions/auth/SignUpAction';
import { createBackendClient } from '@/utils/db/server';
import { signUpSchema } from '@/data/schemas/authSchemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('APP - Auth - SignUpAction', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase = {
            auth: {
                signUp: jest.fn(),
            },
        };
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return reset state when reset flag is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await SignUpAction(undefined, formData);

        expect(result).toEqual({
            email: '',
            password: '',
            cnfPassword: '',
            message: undefined,
            error: undefined,
            validationErrors: undefined,
        });
    });

    it('should return validation errors and cover "|| null" logic on failure', async () => {
        const formData = new FormData();
        const result = await SignUpAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.email).toBe('');
        expect(result.password).toBe('');
        expect(result.message).toBe('Please correct the errors below.');
    });

    it('should return mapped error message when signUp fails', async () => {
        mockSupabase.auth.signUp.mockResolvedValue({
            error: { code: 'email_exists', message: 'Already exists' },
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');
        formData.append('cnfPassword', 'Password123!');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('An account with this email already exists.');
        expect(result.error).toBeDefined();
    });

    it('should cover fallback error messages and "|| null" in the authError block', async () => {
        const spy = jest.spyOn(signUpSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { email: 'test@test.com', password: 'Pass' },
        } as any);

        mockSupabase.auth.signUp.mockResolvedValue({
            error: { code: '', message: '' },
        });

        const formData = new FormData();
        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('Failed to create account.');
        expect(result.email).toBe('');
        expect(result.password).toBe('');

        spy.mockRestore();
    });

    it('should redirect to profile on success', async () => {
        mockSupabase.auth.signUp.mockResolvedValue({ error: null });

        const formData = new FormData();
        formData.append('email', 'newuser@example.com');
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        await SignUpAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });
});
