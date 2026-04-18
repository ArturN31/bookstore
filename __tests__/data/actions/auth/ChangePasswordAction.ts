import { ChangePasswordAction } from '@/data/actions/auth/ChangePasswordAction';
import { passwordSchema } from '@/data/schemas/authSchemas';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

describe('ChangePasswordAction', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: jest.fn(),
                updateUser: jest.fn().mockRejectedValue(new Error('Simulated Update Error')),
                signOut: jest.fn(),
            },
        };
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
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

    it('should handle reauthentication required errors', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockSupabase.auth.updateUser.mockResolvedValue({
            error: { message: 'Needs reauthentication to update' },
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toContain('Security timeout');
    });

    it('should handle weak password errors', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockSupabase.auth.updateUser.mockResolvedValue({
            error: { code: 'weak_password', message: 'too simple' },
        });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBeDefined();
    });

    it('should sign out and redirect on success', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        await ChangePasswordAction(undefined, formData);

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(redirect).toHaveBeenCalledWith('/user/auth/signin');
    });

    it('should return null for password fields if they are empty strings on validation failure', async () => {
        const formData = new FormData();
        formData.append('password', '');
        formData.append('cnfPassword', '');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Validation failed. Please check the requirements.');
    });

    it('BRANCH COVERAGE: hits null branches in Auth and Supabase blocks', async () => {
        const zodSpy = jest.spyOn(passwordSchema, 'safeParse').mockReturnValue({
            success: true,
            data: { password: '' },
        } as any);

        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        const formData = new FormData();
        formData.append('password', '');

        const result = await ChangePasswordAction(undefined, formData);

        expect(result.message).toBe('Session expired. Please log in again.');

        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockSupabase.auth.updateUser.mockResolvedValue({
            error: { message: 'Random Error', code: '500' },
        });

        const result2 = await ChangePasswordAction(undefined, formData);

        expect(result2.message).toBeDefined();

        zodSpy.mockRestore();
    });

    it('should handle catch block errors and return a specific friendly message', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const formData = new FormData();
        formData.append('password', 'ValidPass123!');
        formData.append('cnfPassword', 'ValidPass123!');

        const result = await ChangePasswordAction(undefined, formData);

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ChangePasswordAction] Critical Failure:',
            new TypeError(
                "Cannot destructure property 'data' of '(intermediate value)' as it is undefined.",
            ),
        );
        expect(result.message).toBe('A server error occurred.');
    });
});
