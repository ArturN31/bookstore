import { updateUsername } from '@/data/user/UserService';
import { createBackendClient } from '@/utils/db/server';
import {
    fetchUserAuthData,
    updateUsername as repoUpdateUsername,
} from '@/data/user/UserRepository';
import { UserServiceLogPrefix } from '@/data/user/UserConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { withRetry } from '@/utils/network/retry';
import {
    VALID_UUID,
    OTHER_UUID,
    mockGetUser,
    setupUserServiceTestDefaults,
} from './UserServiceTestHelpers';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserRepository');
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => {
        if (typeof err === 'string') return `Sanitized: ${err}`;
        if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof (err as { message: unknown }).message === 'string'
        ) {
            return `Sanitized: ${(err as { message: string }).message}`;
        }
        if (err instanceof Error) {
            return `Sanitized: ${err.message}`;
        }
        return 'Sanitized error';
    }),
    APP_ERROR_MESSAGES: {
        INVALID_USER_SESSION: 'User session is invalid.',
        MALFORMED_IDENTIFIER: 'Malformed identifier parameters.',
        INVALID_QUANTITY: 'Invalid quantity assignment.',
        UNAUTHORIZED_ACCESS: 'Unauthorized access token',
        UNAUTHENTICATED_USER: 'Unauthenticated user context',
        NO_DATA_RETURNED: 'No data returned.',
        FAILED_TO_CREATE_CART: 'Failed to create cart.',
        CART_CREATION_FAILED: 'Cart creation failed.',
        SESSION_IDENTIFICATION_FAILED: 'Session identification failed.',
        UNSUPPORTED_ACTION_TYPE: 'Unsupported action type.',
        ERROR_SUPABASE_FAILED: 'Supabase client is undefined.',
        ERROR_DATABASE_QUERY_FAILED: 'Database query failed.',
        ERROR_SYSTEM_ERROR: 'A system error occurred or connection timed out.',
        ERROR_AUTH_FAILED: 'User session not found.',
        ERROR_PROFILE_NOT_FOUND: 'User profile not found.',
        ERROR_PROFILE_FETCH_FAILED: 'Failed to retrieve profile data.',
        ERROR_WISHLIST_FETCH_FAILED: 'Could not load wishlist.',
        ERROR_WISHLIST_SYSTEM_ERROR: 'Failed to fetch wishlist due to network issues.',
        ERROR_WISHLIST_NOT_FOUND: 'Wishlist not found.',
        ERROR_MISSING_USER_ID: 'No user ID provided.',
        ERROR_EMAIL_NOT_FOUND: 'Email not found.',
    },
}));

describe('UserService - updateUsername', () => {
    beforeEach(() => {
        setupUserServiceTestDefaults();
        (withRetry as jest.Mock).mockImplementation(<T>(fn: () => Promise<T>) => fn());
    });

    afterEach(() => {
        (console.error as jest.MockedFunction<typeof console.error>).mockRestore();
    });

    it('should update username successfully', async () => {
        const mockUpdatedUser = [{ id: VALID_UUID, username: 'newname' }];
        (repoUpdateUsername as jest.MockedFunction<typeof repoUpdateUsername>).mockResolvedValue({
            data: mockUpdatedUser,
            error: null,
        } as unknown as Awaited<ReturnType<typeof repoUpdateUsername>>);

        const result = await updateUsername('newname');

        expect(result.data).toEqual(mockUpdatedUser);
        expect(result.error).toBeNull();
    });

    it('should fallback to empty array when updateResult data is null on success', async () => {
        (repoUpdateUsername as jest.MockedFunction<typeof repoUpdateUsername>).mockResolvedValue({
            data: null,
            error: null,
        } as unknown as Awaited<ReturnType<typeof repoUpdateUsername>>);

        const result = await updateUsername('newname');

        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should return empty array when updateResult data is null/undefined and error is null via custom withRetry', async () => {
        (withRetry as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await updateUsername('newname');

        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should return auth error when fetchUserAuthData returns error during updateUsername', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: null,
            error: 'fail',
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return auth error when user payload is missing from auth data in updateUsername', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: null },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return auth error when userID is not a valid UUID during updateUsername', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: { id: 'invalid-uuid', email: 'test@test.com' } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return sanitized error when repository updateUsername returns error via exception', async () => {
        (repoUpdateUsername as jest.MockedFunction<typeof repoUpdateUsername>).mockResolvedValue({
            data: null,
            error: 'Update failed',
        } as unknown as Awaited<ReturnType<typeof repoUpdateUsername>>);

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Sanitized: Update failed');
    });

    it('should handle non-string error object from repository updateUsername by JSON stringifying it', async () => {
        (repoUpdateUsername as jest.MockedFunction<typeof repoUpdateUsername>).mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'Unique violation' },
        } as unknown as Awaited<ReturnType<typeof repoUpdateUsername>>);

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toContain('Sanitized:');
    });

    it('should return sanitized error when updateResult contains an error without throwing', async () => {
        (withRetry as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: 'Direct update error',
        });

        const result = await updateUsername('newname');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Sanitized: Direct update error');
    });

    it('should handle Error object in updateUsername catch', async () => {
        const updateFail = new Error('Update System Fail');
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockRejectedValue(
            updateFail,
        );

        const result = await updateUsername('newname');

        expect(console.error).toHaveBeenCalledWith(
            `${UserServiceLogPrefix} Update Username System Error:`,
            updateFail,
        );
        expect(result.error).toBe('Sanitized: Update System Fail');
    });

    it('should handle session ID mismatch during updateUsername', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: OTHER_UUID } },
            error: null,
        });

        const result = await updateUsername('newname');
        expect(result.error).toContain(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    });
});
