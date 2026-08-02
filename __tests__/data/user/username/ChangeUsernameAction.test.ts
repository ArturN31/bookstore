import { ChangeUsernameAction } from '@/data/user/username/ChangeUsernameAction';
import { updateUsername } from '@/data/user/UserRepository';
import { getUserData } from '@/data/user/UserService';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { Database } from '@/database.types';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

type UserRow = Database['public']['Tables']['users']['Row'];

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserService');
jest.mock('@/data/user/UserRepository');
jest.mock('@/utils/errors/SupabaseErrorHandler', () => {
    const actual = jest.requireActual('@/utils/errors/SupabaseErrorHandler');
    return {
        ...actual,
        sanitizeSupabaseError: jest.fn(),
    };
});
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

describe('ChangeUsernameAction', () => {
    const mockedRedirect = redirect as jest.MockedFunction<typeof redirect>;
    const mockedRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
    const mockedUpdateUsername = updateUsername as jest.MockedFunction<typeof updateUsername>;
    const mockedSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedRevalidatePath.mockImplementation(() => {});
        mockedRedirect.mockImplementation(() => undefined as never);
        mockedUpdateUsername.mockResolvedValue({
            data: [] as UserRow[],
            error: null,
            count: null,
            status: 200,
            statusText: 'OK',
        } as PostgrestSingleResponse<UserRow[]>);
        mockedSanitizeSupabaseError.mockImplementation((err: unknown) => {
            if (err instanceof Error) return err.message;
            if (typeof err === 'string') return err;
            if (
                err &&
                typeof err === 'object' &&
                'message' in err &&
                typeof (err as PostgrestError).message === 'string'
            ) {
                return (err as PostgrestError).message;
            }
            return '';
        });
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

        expect(result.message).toBe('Not authenticated');
    });

    it('should fallback to session expired message when sanitizeSupabaseError returns falsy for authError', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: null,
            error: { message: 'auth fail' },
        });
        mockedSanitizeSupabaseError.mockReturnValueOnce('');

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

    it('should return error state when database update fails with taken username', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        const dbError = {
            message: 'This record already exists. Please use a different value.',
            code: '23505',
            details: '',
            hint: '',
        } as PostgrestError;
        mockedUpdateUsername.mockResolvedValue({
            data: null,
            error: dbError,
            count: null,
            status: 409,
            statusText: 'Conflict',
        } as PostgrestSingleResponse<UserRow[]>);

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('This username is already taken.');
        expect(result.isUsernameTaken).toBe(true);
    });

    it('should return raw dbError when database update fails with a non-taken error', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        const customDbError = {
            message: 'Database connection timeout',
            code: '08006',
            details: '',
            hint: '',
        } as PostgrestError;
        mockedUpdateUsername.mockResolvedValue({
            data: null,
            error: customDbError,
            count: null,
            status: 500,
            statusText: 'Internal Server Error',
        } as PostgrestSingleResponse<UserRow[]>);

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe(customDbError.message);
        expect(result.isUsernameTaken).toBe(false);
    });

    it('should revalidate and redirect on success', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        mockedUpdateUsername.mockResolvedValue({
            data: [] as UserRow[],
            error: null,
            count: null,
            status: 200,
            statusText: 'OK',
        } as PostgrestSingleResponse<UserRow[]>);

        await ChangeUsernameAction(undefined, formData);

        expect(mockedRevalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(mockedRedirect).toHaveBeenCalledWith('/user/profile');
    });

    it('should handle catch block errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const formData = new FormData();
        formData.append('username', 'newusername');
        (getUserData as jest.Mock).mockRejectedValue(new Error('Pipeline failure'));

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('Pipeline failure');
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
        mockedUpdateUsername.mockResolvedValue({
            data: [] as UserRow[],
            error: null,
            count: null,
            status: 200,
            statusText: 'OK',
        } as PostgrestSingleResponse<UserRow[]>);

        await ChangeUsernameAction(undefined, formData);

        expect(mockedRedirect).toHaveBeenCalled();
    });

    it('should handle previous state with existing values', async () => {
        const formData = new FormData();
        formData.append('username', 'validuser');
        (getUserData as jest.Mock).mockResolvedValue({
            data: { id: 'user-123', username: 'olduser' },
            error: null,
        });
        mockedUpdateUsername.mockResolvedValue({
            data: [] as UserRow[],
            error: null,
            count: null,
            status: 200,
            statusText: 'OK',
        } as PostgrestSingleResponse<UserRow[]>);

        const prevState = { username: 'previous', message: 'Previous message' };
        await ChangeUsernameAction(prevState, formData);

        expect(mockedRedirect).toHaveBeenCalled();
    });

    it('BRANCH COVERAGE: should re-throw NEXT_REDIRECT error when thrown inside try block', async () => {
        const formData = new FormData();
        formData.append('username', 'newusername');

        (getUserData as jest.Mock).mockImplementation(() => {
            throw new Error('NEXT_REDIRECT');
        });

        await expect(ChangeUsernameAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('BRANCH COVERAGE: should return server error message when catch block intercepts non-redirect generic error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const formData = new FormData();
        formData.append('username', 'newusername');

        const genericError = new Error('SOME_OTHER_DB_OR_ROUTER_FAIL');
        (getUserData as jest.Mock).mockImplementation(() => {
            throw genericError;
        });

        const result = await ChangeUsernameAction(undefined, formData);

        expect(result.message).toBe('SOME_OTHER_DB_OR_ROUTER_FAIL');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
