import { SignUpAction } from '@/data/actions/auth/SignUpAction';
import { createBackendClient } from '@/utils/db/server';
import { signUpSchema } from '@/data/schemas/authSchemas';
import { registerUser } from '@/data/actions/auth/AuthRepository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('@/data/actions/auth/AuthRepository');
jest.mock('@/data/schemas/authSchemas');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('APP - Auth - SignUpAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (createBackendClient as jest.Mock).mockResolvedValue({});
    });

    it('should return reset state when reset flag is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await SignUpAction(undefined, formData);

        expect(result).toEqual({
            message: null,
            validationErrors: undefined,
        });
    });

    it('should return validation errors', async () => {
        (signUpSchema.safeParse as jest.Mock).mockReturnValue({
            success: false,
            error: { issues: [{ message: 'Invalid input' }] },
        });

        const formData = new FormData();
        const result = await SignUpAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please resolve the validation errors.');
    });

    it('should return mapped error message when signUp fails', async () => {
        (signUpSchema.safeParse as jest.Mock).mockReturnValue({
            success: true,
            data: { email: 'test@example.com', password: 'Password123!' },
        });
        (registerUser as jest.Mock).mockResolvedValue({
            error: { code: 'email_exists', message: 'Already exists' },
        });

        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'Password123!');

        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBeDefined();
    });

    it('should redirect to profile on success', async () => {
        (signUpSchema.safeParse as jest.Mock).mockReturnValue({
            success: true,
            data: { email: 'newuser@example.com', password: 'ValidPass123!' },
        });
        (registerUser as jest.Mock).mockResolvedValue({ error: null });

        const formData = new FormData();
        formData.append('email', 'newuser@example.com');
        formData.append('password', 'ValidPass123!');

        await SignUpAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should handle critical server error in catch block (covers line 52 false branch)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (signUpSchema.safeParse as jest.Mock).mockReturnValue({
            success: true,
            data: { email: 'test@example.com', password: 'Password123!' },
        });
        (registerUser as jest.Mock).mockRejectedValue(new Error('Database explosion'));

        const formData = new FormData();
        const result = await SignUpAction(undefined, formData);

        expect(result.message).toBe('A server error occurred during registration.');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('BRANCH COVERAGE: should re-throw NEXT_REDIRECT error caught inside try block (covers line 52 true branch)', async () => {
        (signUpSchema.safeParse as jest.Mock).mockReturnValue({
            success: true,
            data: { email: 'test@example.com', password: 'Password123!' },
        });
        (registerUser as jest.Mock).mockRejectedValue(new Error('NEXT_REDIRECT'));

        const formData = new FormData();
        await expect(SignUpAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });
});
