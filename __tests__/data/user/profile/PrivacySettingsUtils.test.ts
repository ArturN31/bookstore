import { revalidatePath } from 'next/cache';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { createBackendClient } from '@/utils/db/server';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import {
    generateShareToken,
    revalidateUserPrivacyPaths,
    verifyAuthorizedUser,
} from '@/data/user/profile/PrivacySettingsUtils';
import { PRIVACY_REVALIDATION_ROUTES } from '@/data/user/profile/PrivacySettingsConstants';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

describe('PrivacySettingsUtils', () => {
    const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
        typeof createBackendClient
    >;
    const mockRecordSecurityAuditLog = recordSecurityAuditLog as jest.MockedFunction<
        typeof recordSecurityAuditLog
    >;
    const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateShareToken', () => {
        it('returns a valid UUID string', () => {
            const token = generateShareToken();
            expect(typeof token).toBe('string');
            expect(token).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
        });
    });

    describe('verifyAuthorizedUser', () => {
        it('returns unauthorized error and logs security audit when user is unauthenticated', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: new Error('Session invalid'),
                    }),
                },
            } as unknown as SupabaseClient<Database>;
            mockCreateBackendClient.mockResolvedValueOnce(mockSupabase);

            const result = await verifyAuthorizedUser('target-user-123', 'UPDATE_ACTION');

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith('UNAUTHORIZED_ACCESS', null, {
                targetUserId: 'target-user-123',
                actionAttempted: 'UPDATE_ACTION',
                reason: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER,
            });
            expect(result).toEqual({
                user: null,
                error: APP_ERROR_MESSAGES.UNAUTHORIZED_PRIVACY_UPDATE_ATTEMPT,
            });
        });

        it('returns forbidden error and logs security audit when targetUserId does not match authenticated user with payload', async () => {
            const authenticatedUser = { id: 'authenticated-user-789' } as User;
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: authenticatedUser },
                        error: null,
                    }),
                },
            } as unknown as SupabaseClient<Database>;
            mockCreateBackendClient.mockResolvedValueOnce(mockSupabase);

            const payload = { is_profile_public: true };
            const result = await verifyAuthorizedUser('target-user-123', 'UPDATE_ACTION', payload);

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS',
                'authenticated-user-789',
                {
                    targetUserId: 'target-user-123',
                    actionAttempted: 'UPDATE_ACTION',
                    attemptedPayload: JSON.stringify(payload),
                    reason: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
                },
            );
            expect(result).toEqual({
                user: null,
                error: APP_ERROR_MESSAGES.FORBIDDEN_PRIVACY_UPDATE_ATTEMPT,
            });
        });

        it('returns forbidden error and logs security audit when targetUserId does not match authenticated user without payload', async () => {
            const authenticatedUser = { id: 'authenticated-user-789' } as User;
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: authenticatedUser },
                        error: null,
                    }),
                },
            } as unknown as SupabaseClient<Database>;
            mockCreateBackendClient.mockResolvedValueOnce(mockSupabase);

            const result = await verifyAuthorizedUser('target-user-123', 'UPDATE_ACTION');

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS',
                'authenticated-user-789',
                {
                    targetUserId: 'target-user-123',
                    actionAttempted: 'UPDATE_ACTION',
                    attemptedPayload: undefined,
                    reason: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
                },
            );
            expect(result).toEqual({
                user: null,
                error: APP_ERROR_MESSAGES.FORBIDDEN_PRIVACY_UPDATE_ATTEMPT,
            });
        });

        it('returns authenticated user when user ID matches targetUserId', async () => {
            const authenticatedUser = { id: 'target-user-123' } as User;
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: authenticatedUser },
                        error: null,
                    }),
                },
            } as unknown as SupabaseClient<Database>;
            mockCreateBackendClient.mockResolvedValueOnce(mockSupabase);

            const result = await verifyAuthorizedUser('target-user-123', 'UPDATE_ACTION');

            expect(mockRecordSecurityAuditLog).not.toHaveBeenCalled();
            expect(result).toEqual({
                user: authenticatedUser,
                error: null,
            });
        });
    });

    describe('revalidateUserPrivacyPaths', () => {
        it('does not call revalidatePath if username is missing', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null });
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockSupabase = {
                from: jest.fn().mockReturnValue({ select: mockSelect }),
            } as unknown as SupabaseClient<Database>;

            await revalidateUserPrivacyPaths(mockSupabase, 'user-123');

            expect(mockRevalidatePath).not.toHaveBeenCalled();
        });

        it('revalidates profile and wishlist paths by default when username exists', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { username: 'john_doe' } });
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockSupabase = {
                from: jest.fn().mockReturnValue({ select: mockSelect }),
            } as unknown as SupabaseClient<Database>;

            await revalidateUserPrivacyPaths(mockSupabase, 'user-123');

            expect(mockRevalidatePath).toHaveBeenCalledTimes(2);
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.PROFILE('john_doe'),
            );
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.WISHLIST('john_doe'),
            );
        });

        it('revalidates all privacy paths when includeReviewsAndPublicProfile is true', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { username: 'john_doe' } });
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockSupabase = {
                from: jest.fn().mockReturnValue({ select: mockSelect }),
            } as unknown as SupabaseClient<Database>;

            await revalidateUserPrivacyPaths(mockSupabase, 'user-123', {
                includeReviewsAndPublicProfile: true,
            });

            expect(mockRevalidatePath).toHaveBeenCalledTimes(4);
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.PROFILE('john_doe'),
            );
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.WISHLIST('john_doe'),
            );
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.PUBLIC_PROFILE('john_doe'),
            );
            expect(mockRevalidatePath).toHaveBeenCalledWith(
                PRIVACY_REVALIDATION_ROUTES.REVIEWS('john_doe'),
            );
        });
    });
});
