import { UserReviewAction } from '@/data/books/reviews/ReviewAction';
import { createBackendClient } from '@/utils/db/server';
import { insertUserReview } from '@/data/books/reviews/ReviewRepository';
import { mapToReviewPayload } from '@/data/books/reviews/ReviewMapper';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/data/books/reviews/ReviewRepository', () => ({
    insertUserReview: jest.fn(),
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
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn((url: string) => {
        const error = new Error('NEXT_REDIRECT');
        (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
        throw error;
    }),
}));

describe('UserReviewAction', () => {
    const mockCreateBackendClient = createBackendClient as jest.Mock;
    const mockInsertUserReview = insertUserReview as jest.Mock;
    const mockMapToReviewPayload = mapToReviewPayload as jest.Mock;
    const mockRecordSecurityAuditLog = recordSecurityAuditLog as jest.Mock;
    const mockRevalidatePath = revalidatePath as jest.Mock;
    const mockRedirect = redirect as unknown as jest.Mock;

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
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest
                            .fn()
                            .mockResolvedValue({ data: { username: 'dbuser' }, error: null }),
                    }),
                }),
            }),
        };
        mockCreateBackendClient.mockResolvedValue(mockSupabase);
        mockMapToReviewPayload.mockReturnValue({ rating: 5, review: 'Great book!' });
        mockInsertUserReview.mockResolvedValue({ error: null });
    });

    it('should return initial state when reset is present in formData', async () => {
        const formData = new FormData();
        formData.append('reset', 'yes');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, validationErrors: undefined });
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

    it('should return session expired and record security audit log when auth fails with error object', async () => {
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

    it('should return session expired with Session expired fallback message when auth fails without error object', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: null,
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            null,
            expect.objectContaining({ error: 'Session expired' }),
        );
        expect(result.message).toBeDefined();
    });

    it('should use username provided directly in formData', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');
        formData.append('username', 'formuser');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
        expect(mockInsertUserReview).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ username: 'formuser' }),
        );
    });

    it('should fetch username from db if not provided in formData and successfully insert review and redirect', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
        expect(mockInsertUserReview).toHaveBeenCalled();
        expect(mockRevalidatePath).toHaveBeenCalled();
        expect(mockRedirect).toHaveBeenCalledWith('/book/book-123');
    });

    it('should use username from metadata if db user record has no username', async () => {
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    maybeSingle: jest
                        .fn()
                        .mockResolvedValue({ data: { username: null }, error: null }),
                }),
            }),
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
        expect(mockInsertUserReview).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ username: 'metauser' }),
        );
    });

    it('should fall back to email prefix and anonymous when username is completely missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: { id: 'user-123', email: 'test@example.com', user_metadata: {} } },
            error: null,
        });
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    maybeSingle: jest
                        .fn()
                        .mockResolvedValue({ data: { username: null }, error: null }),
                }),
            }),
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
        expect(mockInsertUserReview).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ username: 'test' }),
        );
    });

    it('should fall back to Anonymous when username, metadata username, and email are missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: { id: 'user-123', email: null, user_metadata: {} } },
            error: null,
        });
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    maybeSingle: jest
                        .fn()
                        .mockResolvedValue({ data: { username: null }, error: null }),
                }),
            }),
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
        expect(mockInsertUserReview).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ username: 'Anonymous' }),
        );
    });

    it('should handle duplicate review database error via code correctly', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle duplicate review database error via DB_ERROR_MAP sanitized error correctly', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: { message: 'MAP_23505' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle duplicate review database error via message property containing duplicate correctly', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: { message: 'Duplicate review entry found' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle duplicate review database error when error is a string containing duplicate', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: 'Database error: duplicate constraint violation',
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle duplicate review database error via details property correctly', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: { details: 'Key already exists (duplicate)' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle general database insertion failure', async () => {
        mockInsertUserReview.mockResolvedValueOnce({
            error: { code: '500', message: 'Internal server error' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should rethrow NEXT_REDIRECT error if thrown inside the try block', async () => {
        mockInsertUserReview.mockImplementationOnce(() => {
            throw new Error('NEXT_REDIRECT');
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle generic unexpected exceptions gracefully when throwing an Error', async () => {
        mockInsertUserReview.mockImplementationOnce(() => {
            throw new Error('Unexpected failure');
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should handle non-Error thrown exceptions gracefully', async () => {
        mockInsertUserReview.mockImplementationOnce(() => {
            throw 'Non-Error string exception';
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });
});
