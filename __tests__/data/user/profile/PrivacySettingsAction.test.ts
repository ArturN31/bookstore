import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import {
    generateOrResetWishlistShareToken,
    updateUserPrivacySettings,
} from '@/data/user/profile/PrivacySettingsService';
import {
    regenerateWishlistShareTokenAction,
    updatePrivacySettingsAction,
} from '@/data/user/profile/PrivacySettingsAction';
import {
    revalidateUserPrivacyPaths,
    verifyAuthorizedUser,
} from '@/data/user/profile/PrivacySettingsUtils';
import { PRIVACY_SETTINGS_ACTIONS } from '@/data/user/profile/PrivacySettingsConstants';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn(),
}));

jest.mock('@/data/user/profile/PrivacySettingsService', () => ({
    generateOrResetWishlistShareToken: jest.fn(),
    updateUserPrivacySettings: jest.fn(),
}));

jest.mock('@/data/user/profile/PrivacySettingsUtils', () => ({
    revalidateUserPrivacyPaths: jest.fn(),
    verifyAuthorizedUser: jest.fn(),
}));

describe('PrivacySettingsAction', () => {
    const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
        typeof createBackendClient
    >;
    const mockSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;
    const mockUpdateUserPrivacySettings = updateUserPrivacySettings as jest.MockedFunction<
        typeof updateUserPrivacySettings
    >;
    const mockGenerateOrResetWishlistShareToken =
        generateOrResetWishlistShareToken as jest.MockedFunction<
            typeof generateOrResetWishlistShareToken
        >;
    const mockRevalidateUserPrivacyPaths = revalidateUserPrivacyPaths as jest.MockedFunction<
        typeof revalidateUserPrivacyPaths
    >;
    const mockVerifyAuthorizedUser = verifyAuthorizedUser as jest.MockedFunction<
        typeof verifyAuthorizedUser
    >;

    const dummyUser = { id: 'user-123' } as User;
    const dummySupabase = {} as SupabaseClient<Database>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updatePrivacySettingsAction', () => {
        it('returns error when verifyAuthorizedUser returns auth error', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: null,
                error: 'Unauthorized access attempt',
            });

            const result = await updatePrivacySettingsAction('target-user-123', {
                is_profile_public: true,
            });

            expect(mockVerifyAuthorizedUser).toHaveBeenCalledWith(
                'target-user-123',
                PRIVACY_SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS,
                { is_profile_public: true },
            );
            expect(result).toEqual({
                success: false,
                error: 'Unauthorized access attempt',
            });
        });

        it('returns fallback Unauthorized error if authResult error is empty', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: null,
                error: null,
            });

            const result = await updatePrivacySettingsAction('target-user-123', {
                is_profile_public: true,
            });

            expect(result).toEqual({
                success: false,
                error: 'Unauthorized',
            });
        });

        it('returns error when updateUserPrivacySettings fails', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: dummyUser,
                error: null,
            });
            mockUpdateUserPrivacySettings.mockResolvedValueOnce({
                error: 'Failed to update settings',
            });

            const result = await updatePrivacySettingsAction('user-123', {
                is_profile_public: false,
            });

            expect(mockUpdateUserPrivacySettings).toHaveBeenCalledWith('user-123', {
                is_profile_public: false,
            });
            expect(result).toEqual({
                success: false,
                error: 'Failed to update settings',
            });
        });

        it('revalidates paths and returns success true on successful update', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: dummyUser,
                error: null,
            });
            mockUpdateUserPrivacySettings.mockResolvedValueOnce({
                error: null,
            });
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);

            const result = await updatePrivacySettingsAction('user-123', {
                is_profile_public: true,
            });

            expect(mockCreateBackendClient).toHaveBeenCalled();
            expect(mockRevalidateUserPrivacyPaths).toHaveBeenCalledWith(dummySupabase, 'user-123', {
                includeReviewsAndPublicProfile: true,
            });
            expect(result).toEqual({ success: true });
        });

        it('catches thrown exception and returns sanitized error', async () => {
            const thrownError = new Error('Unexpected error during action');
            mockVerifyAuthorizedUser.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Action Error');

            const result = await updatePrivacySettingsAction('user-123', {
                is_profile_public: true,
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
            expect(result).toEqual({
                success: false,
                error: 'Sanitized Action Error',
            });
        });
    });

    describe('regenerateWishlistShareTokenAction', () => {
        it('returns error when verifyAuthorizedUser returns auth error', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: null,
                error: 'Unauthorized token reset',
            });

            const result = await regenerateWishlistShareTokenAction('target-user-123');

            expect(mockVerifyAuthorizedUser).toHaveBeenCalledWith(
                'target-user-123',
                PRIVACY_SETTINGS_ACTIONS.REGENERATE_WISHLIST_SHARE_TOKEN,
            );
            expect(result).toEqual({
                success: false,
                error: 'Unauthorized token reset',
            });
        });

        it('returns fallback Unauthorized error if authResult error is empty', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: null,
                error: null,
            });

            const result = await regenerateWishlistShareTokenAction('target-user-123');

            expect(result).toEqual({
                success: false,
                error: 'Unauthorized',
            });
        });

        it('returns error when generateOrResetWishlistShareToken fails or returns no token', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: dummyUser,
                error: null,
            });
            mockGenerateOrResetWishlistShareToken.mockResolvedValueOnce({
                token: null,
                error: 'Token generation failed',
            });

            const result = await regenerateWishlistShareTokenAction('user-123');

            expect(mockGenerateOrResetWishlistShareToken).toHaveBeenCalledWith('user-123');
            expect(result).toEqual({
                success: false,
                error: 'Token generation failed',
            });
        });

        it('returns fallback Failed to generate token error when token is null without error', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: dummyUser,
                error: null,
            });
            mockGenerateOrResetWishlistShareToken.mockResolvedValueOnce({
                token: null,
                error: null,
            });

            const result = await regenerateWishlistShareTokenAction('user-123');

            expect(result).toEqual({
                success: false,
                error: 'Failed to generate token',
            });
        });

        it('revalidates user privacy paths and returns success with new token', async () => {
            mockVerifyAuthorizedUser.mockResolvedValueOnce({
                user: dummyUser,
                error: null,
            });
            mockGenerateOrResetWishlistShareToken.mockResolvedValueOnce({
                token: 'generated-token-777',
                error: null,
            });
            mockCreateBackendClient.mockResolvedValueOnce(dummySupabase);

            const result = await regenerateWishlistShareTokenAction('user-123');

            expect(mockCreateBackendClient).toHaveBeenCalled();
            expect(mockRevalidateUserPrivacyPaths).toHaveBeenCalledWith(dummySupabase, 'user-123');
            expect(result).toEqual({
                success: true,
                data: { token: 'generated-token-777' },
            });
        });

        it('catches thrown exception and returns sanitized error', async () => {
            const thrownError = new Error('Unexpected action error');
            mockVerifyAuthorizedUser.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Token Error');

            const result = await regenerateWishlistShareTokenAction('user-123');

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
            expect(result).toEqual({
                success: false,
                error: 'Sanitized Token Error',
            });
        });
    });
});
