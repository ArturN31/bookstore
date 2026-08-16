import {
    isDuplicateReviewError,
    resolveUsername,
    UserTableRow,
    AuthUser,
    SupabaseClient,
} from '@/data/books/reviews/ReviewActionUtils';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => {
        return queryFn();
    }),
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
                user_metadata: { username: '   metaUser   ' },
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
});
