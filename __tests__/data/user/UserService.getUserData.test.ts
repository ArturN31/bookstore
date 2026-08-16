import { getUserData } from '@/data/user/UserService';
import { createBackendClient } from '@/utils/db/server';
import { fetchUserProfileById, fetchUserAuthData } from '@/data/user/UserRepository';
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

const originalWarn = console.warn;

describe('UserService - getUserData', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(
            (message: unknown, ...optionalParams: unknown[]) => {
                if (typeof message === 'string' && message.includes('[SecurityAudit]')) {
                    return;
                }
                originalWarn(message, ...optionalParams);
            },
        );
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        setupUserServiceTestDefaults();
        (withRetry as jest.Mock).mockImplementation(<T>(fn: () => Promise<T>) => fn());
    });

    afterEach(() => {
        (console.error as jest.MockedFunction<typeof console.error>).mockClear();
    });

    it('should return user data on success', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: { id: VALID_UUID, username: 'testuser' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toEqual({
            id: VALID_UUID,
            username: 'testuser',
            email: 'test@test.com',
        });
        expect(result.error).toBeNull();
    });

    it('should exercise profile mapping with default fields', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: { id: VALID_UUID },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toEqual({
            id: VALID_UUID,
            email: 'test@test.com',
        });
        expect(result.error).toBeNull();
    });

    it('should fallback to empty string when user email is missing from auth data', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: { id: VALID_UUID, email: undefined } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: { id: VALID_UUID, username: 'testuser' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toEqual({
            id: VALID_UUID,
            username: 'testuser',
            email: '',
        });
        expect(result.error).toBeNull();
    });

    it('should return auth error when fetchUserAuthData returns error', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: null,
            error: 'fail',
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return auth error when user payload is missing from auth data', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: null },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return auth error when userID is missing', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: { id: '', email: 'test@test.com' } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return auth error when userID is not a valid UUID', async () => {
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: { id: 'invalid-uuid', email: 'test@test.com' } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
    });

    it('should return sanitized error when profile fetch fails via exception', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: null,
            error: 'DB error',
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe('Sanitized: DB error');
    });

    it('should handle non-string error object from fetchUserProfileById by JSON stringifying it', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: null,
            error: { code: '42P01', message: 'relation does not exist' },
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toContain('Sanitized:');
    });

    it('should return sanitized error when profileResult contains an error without throwing', async () => {
        (withRetry as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: 'Direct profile error',
        });

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBe('Sanitized: Direct profile error');
    });

    it('should return null error and null data when profile is null', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: null,
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
    });

    it('should return null error and null data when profileResult error is NO_DATA_RETURNED', async () => {
        (
            fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
        ).mockResolvedValue({
            data: null,
            error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
        } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

        const result = await getUserData();

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
    });

    it('should log error message from Error object in catch', async () => {
        const hardFail = new Error('Hard Fail');
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockRejectedValue(
            hardFail,
        );

        const result = await getUserData();

        expect(console.error).toHaveBeenCalledWith(
            `${UserServiceLogPrefix} Unexpected Error:`,
            hardFail,
        );
        expect(result.error).toBe('Sanitized: Hard Fail');
    });

    it('should log raw error when catch receives non-Error object', async () => {
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockRejectedValue(
            'String Fail',
        );

        const result = await getUserData();

        expect(console.error).toHaveBeenCalledWith(
            `${UserServiceLogPrefix} Unexpected Error:`,
            'String Fail',
        );
        expect(result.error).toBe('Sanitized: String Fail');
    });

    it('should handle verifyUserSession failing due to error or missing user', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: new Error('Session fetch failed'),
        });

        const result = await getUserData();
        expect(result.error).toContain(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    });

    it('should handle session ID mismatch during getUserData', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: OTHER_UUID } },
            error: null,
        });

        const result = await getUserData();
        expect(result.error).toContain(APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    });
});
