import * as Repo from '@/data/user/UserRepository';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import {
    getAuthenticatedUserId,
    isValidUUID,
    verifyUserSession,
} from '@/data/user/UserServiceUtils';

jest.mock('@/data/user/UserRepository');
jest.mock('@/utils/security/securityAuditLogger');

describe('UserService Helpers', () => {
    const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
    const OTHER_UUID = '987e6543-e21b-12d3-a456-426614174999';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isValidUUID', () => {
        it('should return true for a valid UUID', () => {
            expect(isValidUUID(VALID_UUID)).toBe(true);
        });

        it('should return false for an invalid UUID', () => {
            expect(isValidUUID('invalid-uuid')).toBe(false);
            expect(isValidUUID('12345')).toBe(false);
            expect(isValidUUID('')).toBe(false);
        });
    });

    describe('verifyUserSession', () => {
        it('should return user id when session is valid', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: VALID_UUID } },
                        error: null,
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await verifyUserSession(mockSupabase);
            expect(result).toBe(VALID_UUID);
        });

        it('should return null when auth getUser returns error', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: new Error('Auth error'),
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await verifyUserSession(mockSupabase);
            expect(result).toBeNull();
        });
    });

    describe('getAuthenticatedUserId', () => {
        it('should record security audit log for malformed user ID', async () => {
            (
                Repo.fetchUserAuthData as jest.MockedFunction<typeof Repo.fetchUserAuthData>
            ).mockResolvedValue({
                data: { user: { id: 'malformed-id', email: 'test@test.com' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.fetchUserAuthData>>);

            const mockSupabase = {} as unknown as SupabaseClient<Database>;
            const result = await getAuthenticatedUserId(mockSupabase, 'myOperation');

            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'malformed-id',
                {
                    operation: 'myOperation_malformed_id',
                    targetUserId: 'malformed-id',
                },
            );
            expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
        });

        it('should record security audit log with null when user ID is null/undefined (covering lines 37-39 nullish coalescing)', async () => {
            (
                Repo.fetchUserAuthData as jest.MockedFunction<typeof Repo.fetchUserAuthData>
            ).mockResolvedValue({
                data: { user: { id: null as unknown as string, email: 'test@test.com' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.fetchUserAuthData>>);

            const mockSupabase = {} as unknown as SupabaseClient<Database>;
            const result = await getAuthenticatedUserId(mockSupabase, 'myOperation');

            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                {
                    operation: 'myOperation_malformed_id',
                    targetUserId: null,
                },
            );
            expect(result.error).toBe(APP_ERROR_MESSAGES.ERROR_AUTH_FAILED);
        });
    });
});
