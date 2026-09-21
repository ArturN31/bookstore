import {
    isDuplicateReviewError,
    resolveUsername,
    verifyReviewOwnership,
    revalidateReviewCaches,
    UserTableRow,
    AuthUser,
    SupabaseClient,
} from '@/data/books/reviews/ReviewActionUtils';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => {
        return queryFn();
    }),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('ReviewActionUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isDuplicateReviewError', () => {
        it('should return true if sanitizedError matches DB_ERROR_MAP["23505"]', () => {
            const result = isDuplicateReviewError(null, DB_ERROR_MAP['23505']);
            expect(result).toBe(true);
        });

        it('should return true if dbError is an object with code "23505"', () => {
            const result = isDuplicateReviewError({ code: '23505' }, 'Some other error');
            expect(result).toBe(true);
        });

        it('should return true if dbError object message contains "23505" or "duplicate"', () => {
            expect(isDuplicateReviewError({ message: 'Error code 23505 occurred' }, '')).toBe(true);
            expect(isDuplicateReviewError({ message: 'Duplicate record found' }, '')).toBe(true);
        });

        it('should return true if dbError object details contain "23505" or "duplicate"', () => {
            expect(isDuplicateReviewError({ details: 'Key constraint violation 23505' }, '')).toBe(
                true,
            );
            expect(
                isDuplicateReviewError(
                    { details: 'duplicate key value violates unique constraint' },
                    '',
                ),
            ).toBe(true);
        });

        it('should return true if dbError is a string containing "23505" or "duplicate"', () => {
            expect(isDuplicateReviewError('Error 23505', '')).toBe(true);
            expect(isDuplicateReviewError('duplicate entry', '')).toBe(true);
        });

        it('should return false for unrelated errors', () => {
            expect(isDuplicateReviewError('Some random error', 'Random sanitized')).toBe(false);
            expect(
                isDuplicateReviewError(
                    { code: '42P01', message: 'relation does not exist' },
                    'Other',
                ),
            ).toBe(false);
            expect(isDuplicateReviewError(null, 'Other')).toBe(false);
        });
    });

    describe('resolveUsername', () => {
        const mockMaybeSingle = jest.fn();
        const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        const mockSupabase = {
            from: mockFrom,
        } as unknown as SupabaseClient;

        const baseUser: AuthUser = {
            id: 'user-123',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '',
        };

        it('should return provided username when valid and trimmed', async () => {
            const username = await resolveUsername(mockSupabase, baseUser, '  customUser  ');
            expect(username).toBe('customUser');
            expect(mockFrom).not.toHaveBeenCalled();
        });

        it('should return fetched username from database when available', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { username: '   dbUser   ' } as UserTableRow,
                error: null,
            });

            const username = await resolveUsername(mockSupabase, baseUser, undefined);
            expect(username).toBe('dbUser');
            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockSelect).toHaveBeenCalledWith('username');
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
        });

        it('should fallback to user_metadata username when database username is missing', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { username: null } as UserTableRow,
                error: null,
            });

            const userWithMeta: AuthUser = {
                ...baseUser,
                user_metadata: { username: '  metaUser  ' },
            };

            const username = await resolveUsername(mockSupabase, userWithMeta, '');
            expect(username).toBe('metaUser');
        });

        it('should fallback to email prefix when db and metadata usernames are missing', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const userWithEmail: AuthUser = {
                ...baseUser,
                email: 'john.doe@example.com',
            };

            const username = await resolveUsername(mockSupabase, userWithEmail);
            expect(username).toBe('john.doe');
        });

        it('should fallback to "Anonymous" when all other sources are missing', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const anonymousUser: AuthUser = {
                ...baseUser,
                email: undefined,
            };

            const username = await resolveUsername(mockSupabase, anonymousUser);
            expect(username).toBe('Anonymous');
        });
    });

    describe('verifyReviewOwnership', () => {
        const mockMaybeSingle = jest.fn();
        const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        const mockSupabase = {
            from: mockFrom,
        } as unknown as SupabaseClient;

        it('should return true if review exists and belongs to the user', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { user_id: 'user-123' },
                error: null,
            });

            const isValid = await verifyReviewOwnership(mockSupabase, 'review-1', 'user-123');
            expect(isValid).toBe(true);
            expect(recordSecurityAuditLog).not.toHaveBeenCalled();
        });

        it('should return false and log audit event if review does not belong to the user', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: { user_id: 'other-user' },
                error: null,
            });

            const isValid = await verifyReviewOwnership(mockSupabase, 'review-1', 'user-123');
            expect(isValid).toBe(false);
            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-123',
                {
                    operation: 'verifyReviewOwnership_failed',
                    reviewId: 'review-1',
                },
            );
        });

        it('should return false and log audit event if review is not found', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const isValid = await verifyReviewOwnership(mockSupabase, 'review-1', 'user-123');
            expect(isValid).toBe(false);
            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-123',
                {
                    operation: 'verifyReviewOwnership_failed',
                    reviewId: 'review-1',
                },
            );
        });
    });

    describe('revalidateReviewCaches', () => {
        it('should call revalidateTag and revalidatePath with expected values', () => {
            revalidateReviewCaches('book-123', 'my-book-slug');

            expect(revalidateTag).toHaveBeenCalledTimes(3);
            expect(revalidateTag).toHaveBeenCalledWith('books', 'max');
            expect(revalidateTag).toHaveBeenCalledWith('reviews', 'max');
            expect(revalidateTag).toHaveBeenCalledWith('reviews-book-123', 'max');

            expect(revalidatePath).toHaveBeenCalledTimes(4);
            expect(revalidatePath).toHaveBeenCalledWith('/book/my-book-slug', 'page');
            expect(revalidatePath).toHaveBeenCalledWith('/book/[slug]', 'page');
            expect(revalidatePath).toHaveBeenCalledWith('/user/reviews/[username]', 'page');
            expect(revalidatePath).toHaveBeenCalledWith('/', 'page');
        });
    });
});
