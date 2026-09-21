import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { createAdminClient } from '@/utils/db/admin';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';
import {
    fetchPublicUserProfileByUsername,
    fetchUserPrivacySettingsById,
    updateUserPrivacySettingsById,
} from '@/data/user/profile/PrivacySettingsRepository';
import { generateShareToken } from '@/data/user/profile/PrivacySettingsUtils';
import {
    generateOrResetWishlistShareToken,
    getPublicProfile,
    getUserPrivacySettings,
    updateUserPrivacySettings,
} from '@/data/user/profile/PrivacySettingsService';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn(),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(),
}));

jest.mock('@/data/user/profile/PrivacySettingsRepository', () => ({
    fetchPublicUserProfileByUsername: jest.fn(),
    fetchUserPrivacySettingsById: jest.fn(),
    updateUserPrivacySettingsById: jest.fn(),
}));

jest.mock('@/data/user/profile/PrivacySettingsUtils', () => ({
    generateShareToken: jest.fn(),
}));

describe('PrivacySettingsService', () => {
    const mockCreateAdminClient = createAdminClient as jest.MockedFunction<
        typeof createAdminClient
    >;
    const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
        typeof createBackendClient
    >;
    const mockSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;
    const mockWithRetry = withRetry as jest.MockedFunction<typeof withRetry>;
    const mockFetchPublicUserProfileByUsername =
        fetchPublicUserProfileByUsername as jest.MockedFunction<
            typeof fetchPublicUserProfileByUsername
        >;
    const mockFetchUserPrivacySettingsById = fetchUserPrivacySettingsById as jest.MockedFunction<
        typeof fetchUserPrivacySettingsById
    >;
    const mockUpdateUserPrivacySettingsById = updateUserPrivacySettingsById as jest.MockedFunction<
        typeof updateUserPrivacySettingsById
    >;
    const mockGenerateShareToken = generateShareToken as jest.MockedFunction<
        typeof generateShareToken
    >;

    const dummySupabase = {} as SupabaseClient<Database>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockWithRetry.mockImplementation(async <T>(fn: () => Promise<T>): Promise<T> => fn());
    });

    describe('getPublicProfile', () => {
        it('returns profile data on successful fetch', async () => {
            mockCreateAdminClient.mockResolvedValueOnce(dummySupabase);
            mockFetchPublicUserProfileByUsername.mockResolvedValueOnce({
                data: {
                    id: 'user-1',
                    username: 'testuser',
                    created_at: '2026-01-01',
                    is_wishlist_public: true,
                    are_reviews_public: false,
                    is_profile_public: true,
                },
                error: null,
            } as ReturnType<typeof fetchPublicUserProfileByUsername> extends Promise<infer R>
                ? R
                : never);

            const result = await getPublicProfile('testuser');

            expect(result).toEqual({
                data: {
                    id: 'user-1',
                    username: 'testuser',
                    created_at: '2026-01-01',
                    is_wishlist_public: true,
                    are_reviews_public: false,
                    is_profile_public: true,
                },
                error: null,
            });
        });

        it('returns error when repository fetch yields database error', async () => {
            const dbError = { message: 'Database query failed' };
            mockCreateAdminClient.mockResolvedValueOnce(dummySupabase);
            mockFetchPublicUserProfileByUsername.mockResolvedValueOnce({
                data: null,
                error: dbError,
            } as ReturnType<typeof fetchPublicUserProfileByUsername> extends Promise<infer R>
                ? R
                : never);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized error');

            const result = await getPublicProfile('testuser');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: null, error: 'Sanitized error' });
        });

        it('returns data null and error null when profile is missing', async () => {
            mockCreateAdminClient.mockResolvedValueOnce(dummySupabase);
            mockFetchPublicUserProfileByUsername.mockResolvedValueOnce({
                data: null,
                error: null,
            } as ReturnType<typeof fetchPublicUserProfileByUsername> extends Promise<infer R>
                ? R
                : never);

            const result = await getPublicProfile('testuser');

            expect(result).toEqual({ data: null, error: null });
        });

        it('catches thrown exceptions and sanitizes error', async () => {
            const thrownError = new Error('Unhandled exception');
            mockWithRetry.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized exception');

            const result = await getPublicProfile('testuser');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
            expect(result).toEqual({ data: null, error: 'Sanitized exception' });
        });
    });

    describe('getUserPrivacySettings', () => {
        it('returns privacy settings on successful fetch', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockFetchUserPrivacySettingsById.mockResolvedValueOnce({
                data: {
                    is_profile_public: true,
                    is_wishlist_public: false,
                    are_reviews_public: true,
                    wishlist_share_token: 'token-123',
                },
                error: null,
            } as ReturnType<typeof fetchUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await getUserPrivacySettings('user-123');

            expect(result).toEqual({
                data: {
                    is_profile_public: true,
                    is_wishlist_public: false,
                    are_reviews_public: true,
                    wishlist_share_token: 'token-123',
                },
                error: null,
            });
        });

        it('returns sanitized error when query fails', async () => {
            const dbError = { message: 'Read failure' };
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockFetchUserPrivacySettingsById.mockResolvedValueOnce({
                data: null,
                error: dbError,
            } as ReturnType<typeof fetchUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Read Error');

            const result = await getUserPrivacySettings('user-123');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(dbError, 'user-123');
            expect(result).toEqual({ data: null, error: 'Sanitized Read Error' });
        });

        it('returns data null and error null when user record is not found', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockFetchUserPrivacySettingsById.mockResolvedValueOnce({
                data: null,
                error: null,
            } as ReturnType<typeof fetchUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await getUserPrivacySettings('user-123');

            expect(result).toEqual({ data: null, error: null });
        });

        it('catches thrown exception and sanitizes error with user ID context', async () => {
            const thrownError = new Error('Connection refused');
            mockCreateBackendClient.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Conn Error');

            const result = await getUserPrivacySettings('user-123');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError, 'user-123');
            expect(result).toEqual({ data: null, error: 'Sanitized Conn Error' });
        });
    });

    describe('updateUserPrivacySettings', () => {
        it('sets wishlist_share_token to null when is_wishlist_public is true', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: null,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await updateUserPrivacySettings('user-123', {
                is_wishlist_public: true,
            });

            expect(mockUpdateUserPrivacySettingsById).toHaveBeenCalledWith(
                dummySupabase,
                'user-123',
                expect.objectContaining({
                    is_wishlist_public: true,
                    wishlist_share_token: null,
                }),
            );
            expect(result).toEqual({ error: null });
        });

        it('generates a new wishlist token if is_wishlist_public is false and current settings lack token', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockFetchUserPrivacySettingsById.mockResolvedValueOnce({
                data: { wishlist_share_token: null },
                error: null,
            } as ReturnType<typeof fetchUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);
            mockGenerateShareToken.mockReturnValueOnce('generated-token-xyz');
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: null,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await updateUserPrivacySettings('user-123', {
                is_wishlist_public: false,
            });

            expect(mockGenerateShareToken).toHaveBeenCalled();
            expect(mockUpdateUserPrivacySettingsById).toHaveBeenCalledWith(
                dummySupabase,
                'user-123',
                expect.objectContaining({
                    is_wishlist_public: false,
                    wishlist_share_token: 'generated-token-xyz',
                }),
            );
            expect(result).toEqual({ error: null });
        });

        it('preserves existing token if is_wishlist_public is false and current settings already have token', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockFetchUserPrivacySettingsById.mockResolvedValueOnce({
                data: { wishlist_share_token: 'existing-token-123' },
                error: null,
            } as ReturnType<typeof fetchUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: null,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await updateUserPrivacySettings('user-123', {
                is_wishlist_public: false,
            });

            expect(mockGenerateShareToken).not.toHaveBeenCalled();
            expect(mockUpdateUserPrivacySettingsById).toHaveBeenCalledWith(
                dummySupabase,
                'user-123',
                expect.objectContaining({
                    is_wishlist_public: false,
                }),
            );
            expect(result).toEqual({ error: null });
        });

        it('returns sanitized error when update fails', async () => {
            const updateErr = { message: 'Write failed' };
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: updateErr,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Write Error');

            const result = await updateUserPrivacySettings('user-123', {
                is_profile_public: false,
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(updateErr, 'user-123');
            expect(result).toEqual({ error: 'Sanitized Write Error' });
        });

        it('catches thrown exception during update and sanitizes error', async () => {
            const thrownError = new Error('Database down');
            mockCreateBackendClient.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Exception');

            const result = await updateUserPrivacySettings('user-123', {
                is_profile_public: false,
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError, 'user-123');
            expect(result).toEqual({ error: 'Sanitized Exception' });
        });
    });

    describe('generateOrResetWishlistShareToken', () => {
        it('generates new token, updates settings with is_wishlist_public false, and returns token', async () => {
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockGenerateShareToken.mockReturnValueOnce('new-fresh-token');
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: null,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);

            const result = await generateOrResetWishlistShareToken('user-123');

            expect(mockUpdateUserPrivacySettingsById).toHaveBeenCalledWith(
                dummySupabase,
                'user-123',
                expect.objectContaining({
                    is_wishlist_public: false,
                    wishlist_share_token: 'new-fresh-token',
                }),
            );
            expect(result).toEqual({ token: 'new-fresh-token', error: null });
        });

        it('returns sanitized error when update fails during token generation', async () => {
            const updateErr = { message: 'Update failed' };
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);
            mockGenerateShareToken.mockReturnValueOnce('new-token');
            mockUpdateUserPrivacySettingsById.mockResolvedValueOnce({
                error: updateErr,
            } as ReturnType<typeof updateUserPrivacySettingsById> extends Promise<infer R>
                ? R
                : never);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Update Error');

            const result = await generateOrResetWishlistShareToken('user-123');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(updateErr, 'user-123');
            expect(result).toEqual({ token: null, error: 'Sanitized Update Error' });
        });

        it('catches thrown exception and sanitizes error', async () => {
            const thrownError = new Error('Unexpected reset crash');
            mockCreateBackendClient.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Crash');

            const result = await generateOrResetWishlistShareToken('user-123');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError, 'user-123');
            expect(result).toEqual({ token: null, error: 'Sanitized Crash' });
        });
    });
});
