import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import * as Repo from '@/data/user/UserRepository';
import { getPublicUserProfile } from '@/data/user/UserService';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (fn: () => Promise<unknown>) => await fn()),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(async (fn: () => Promise<unknown>) => await fn()),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) =>
        err instanceof Error ? err.message : String(err),
    ),
}));

jest.mock('@/data/user/UserRepository', () => ({
    fetchPublicUserProfileByUsername: jest.fn(),
}));

describe('UserService.getPublicUserProfile', () => {
    const mockSupabase = { auth: {} };
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should successfully return the public user profile when found', async () => {
        const mockProfile = { username: 'johndoe', created_at: '2026-01-01T00:00:00.000Z' };
        (Repo.fetchPublicUserProfileByUsername as jest.Mock).mockResolvedValue({
            data: mockProfile,
            error: null,
        });

        const result = await getPublicUserProfile('johndoe');

        expect(result).toEqual({
            data: mockProfile,
            error: null,
        });
        expect(Repo.fetchPublicUserProfileByUsername).toHaveBeenCalledWith(mockSupabase, 'johndoe');
    });

    it('should return ERROR_PROFILE_NOT_FOUND when repository returns NO_DATA_RETURNED error', async () => {
        (Repo.fetchPublicUserProfileByUsername as jest.Mock).mockResolvedValue({
            data: null,
            error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
        });

        const result = await getPublicUserProfile('unknownuser');

        expect(result).toEqual({
            data: null,
            error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND,
        });
    });

    it('should sanitize and return database errors when safeSupabaseQuery returns an unknown error string', async () => {
        (Repo.fetchPublicUserProfileByUsername as jest.Mock).mockResolvedValue({
            data: null,
            error: 'Some database failure',
        });

        const result = await getPublicUserProfile('johndoe');

        expect(result).toEqual({
            data: null,
            error: 'Some database failure',
        });
        expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should sanitize and return error when profileResult has an error other than NO_DATA_RETURNED', async () => {
        const withRetryMock = require('@/utils/network/retry').withRetry;
        withRetryMock.mockImplementationOnce(async () => ({
            data: null,
            error: 'Direct Profile Error',
        }));

        const result = await getPublicUserProfile('johndoe');

        expect(result).toEqual({
            data: null,
            error: 'Direct Profile Error',
        });
        expect(sanitizeSupabaseError).toHaveBeenCalledWith('Direct Profile Error');
    });

    it('should return ERROR_PROFILE_NOT_FOUND when profileResult.data is null/undefined without query error', async () => {
        (Repo.fetchPublicUserProfileByUsername as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });

        const result = await getPublicUserProfile('emptyuser');

        expect(result).toEqual({
            data: null,
            error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND,
        });
    });

    it('should handle unexpected thrown exceptions and return a sanitized error', async () => {
        const mockError = new Error('Unexpected network failure');
        (Repo.fetchPublicUserProfileByUsername as jest.Mock).mockRejectedValue(mockError);

        const result = await getPublicUserProfile('johndoe');

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(result).toEqual({
            data: null,
            error: 'Unexpected network failure',
        });
        expect(sanitizeSupabaseError).toHaveBeenCalledWith(mockError);
    });
});
