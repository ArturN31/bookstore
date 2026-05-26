import { ChangeUsernameAction } from '@/data/actions/UsernameForm/ChangeUsernameAction';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import { updateUsername } from '@/data/actions/UsernameForm/UsernameRepository';
import { handleUsernameUpdateError } from '@/data/actions/UsernameForm/DatabaseErrorHandler';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/GetUserData');
jest.mock('@/data/actions/UsernameForm/UsernameRepository');
jest.mock('@/data/actions/UsernameForm/DatabaseErrorHandler');
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

describe('ChangeUsernameAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset revalidatePath to normal behavior
        (revalidatePath as jest.Mock).mockImplementation(() => {});
    });

    it('should return initial state when reset is requested', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.username).toBe('');
        expect(result.message).toBeNull();
        expect(result.isUsernameTaken).toBe(false);
    });

    it('should return validation errors for short username', async () => {
        const formData = new FormData();
        formData.append('username', 'ab');

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please resolve the validation errors.');
    });

    it('should return validation errors for long username', async () => {
        const formData = new FormData();
        formData.append('username', 'a'.repeat(51));

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
    });

    it('should return validation errors for invalid characters', async () => {
        const formData = new FormData();
        formData.append('username', 'user@name');

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.validationErrors).toBeDefined();
    });

    it('should return error when user is not authenticated', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({ data: null, error: 'Not authenticated' });

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('Session expired. Please log in again.');
    });

    it('should return message when username is unchanged', async () => {
        const formData = new FormData();
        formData.append('username', 'currentuser');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'currentuser' },
            error: null,
        });

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('This is already your current username.');
    });

    it('should return error state when database update fails', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        (updateUsername as jest.Mock).mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'Unique violation' },
        });
        (handleUsernameUpdateError as jest.Mock).mockReturnValue({
            message: 'Username taken',
            isUsernameTaken: true,
            error: { code: '23505' },
        });

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('Username taken');
        expect(result.isUsernameTaken).toBe(true);
    });

    it('should revalidate and redirect on success', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        (updateUsername as jest.Mock).mockResolvedValue({ data: null, error: null });

        await ChangeUsernameAction(undefined, formData);

        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should re-throw NEXT_REDIRECT error', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        (updateUsername as jest.Mock).mockResolvedValue({ data: null, error: null });
        (revalidatePath as jest.Mock).mockImplementation(() => {
            throw new Error('NEXT_REDIRECT');
        });

        await expect(ChangeUsernameAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle catch block errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockRejectedValue(new Error('Pipeline failure'));

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('A critical server error occurred.');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should handle undefined previous state', async () => {
        const formData = new FormData();
        formData.append('username', 'validuser');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        (updateUsername as jest.Mock).mockResolvedValue({ data: null, error: null });

        await ChangeUsernameAction(undefined, formData);

        expect(redirect).toHaveBeenCalled();
    });

    it('should handle previous state with existing values', async () => {
        const formData = new FormData();
        formData.append('username', 'validuser');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        (updateUsername as jest.Mock).mockResolvedValue({ data: null, error: null });

        const prevState = { username: 'previous', message: 'Previous message' };
        await ChangeUsernameAction(prevState, formData);

        expect(redirect).toHaveBeenCalled();
    });
});
