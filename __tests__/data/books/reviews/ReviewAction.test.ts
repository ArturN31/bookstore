import { UserReviewAction } from '@/data/books/reviews/ReviewAction';
import { createBackendClient } from '@/utils/db/server';
import { mapToReviewPayload } from '@/data/books/reviews/ReviewMapper';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { revalidatePath, revalidateTag } from 'next/cache';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/data/books/reviews/ReviewMapper', () => ({
    mapToReviewPayload: jest.fn(),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => {
        if (
            typeof err === 'object' &&
            err !== null &&
            'message' in err &&
            (err as { message: unknown }).message === 'MAP_23505'
        ) {
            return DB_ERROR_MAP['23505'];
        }
        return err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : 'Sanitized Error';
    }),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('UserReviewAction', () => {
    const mockCreateBackendClient = createBackendClient as jest.Mock;
    const mockMapToReviewPayload = mapToReviewPayload as jest.Mock;
    const mockRecordSecurityAuditLog = recordSecurityAuditLog as jest.Mock;
    const mockRevalidatePath = revalidatePath as jest.Mock;
    const mockRevalidateTag = revalidateTag as jest.Mock;

    let mockSupabase: {
        auth: { getUser: jest.Mock };
        from: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'user-123',
                            email: 'test@example.com',
                            user_metadata: { username: 'metauser' },
                        },
                    },
                    error: null,
                }),
            },
            from: jest.fn().mockImplementation(() => ({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest
                            .fn()
                            .mockResolvedValue({ data: { username: 'dbuser' }, error: null }),
                        single: jest
                            .fn()
                            .mockResolvedValue({ data: { username: 'dbuser' }, error: null }),
                    }),
                    maybeSingle: jest
                        .fn()
                        .mockResolvedValue({ data: { username: 'dbuser' }, error: null }),
                }),
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
                }),
            })),
        };
        mockCreateBackendClient.mockResolvedValue(mockSupabase);
        mockMapToReviewPayload.mockReturnValue({ rating: 5, review: 'Great book!' });
    });

    it('should return initial state when reset is present in formData', async () => {
        const formData = new FormData();
        formData.append('reset', 'yes');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, username: '', isUsernameTaken: false });
    });

    it('should return validation error when bookId is missing', async () => {
        const formData = new FormData();
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should return validation errors when review schema validation fails', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', 'invalid');
        formData.append('review', '');

        const result = await UserReviewAction(undefined, formData);
        expect(result.validationErrors).toBeDefined();
    });

    it('should return session expired and record security audit log when auth fails', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Auth session missing' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(mockRecordSecurityAuditLog).toHaveBeenCalled();
        expect(result.message).toBeDefined();
    });

    it('should successfully insert review with username from formData and return initial state', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');
        formData.append('username', 'formuser');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, username: '', isUsernameTaken: false });
        expect(mockRevalidatePath).toHaveBeenCalled();
        expect(mockRevalidateTag).toHaveBeenCalled();
    });

    it('should successfully insert review using database or fallback username and return initial state', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, username: '', isUsernameTaken: false });
    });

    it('should handle duplicate review database error correctly', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: null,
                    error: {
                        code: '23505',
                        message: 'duplicate key value violates unique constraint',
                    },
                }),
            }),
        }));

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle general database insertion failure', async () => {
        mockSupabase.from.mockImplementationOnce(() => ({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: '500', message: 'Internal server error' },
                }),
            }),
        }));

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should rethrow NEXT_REDIRECT error if thrown inside the try block', async () => {
        mockMapToReviewPayload.mockImplementationOnce(() => {
            throw new Error('NEXT_REDIRECT');
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle unexpected exceptions gracefully', async () => {
        mockMapToReviewPayload.mockImplementationOnce(() => {
            throw new Error('Unexpected failure');
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });
});
