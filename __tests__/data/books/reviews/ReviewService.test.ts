import { deleteReviewAction, fetchUserReviewsAction } from '@/data/books/reviews/ReviewService';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => queryFn()),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) =>
        err instanceof Error ? err.message : 'Sanitized Error',
    ),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('UserReviewsActions', () => {
    const mockCreateBackendClient = createBackendClient as jest.Mock;
    const mockSanitizeSupabaseError = sanitizeSupabaseError as jest.Mock;
    const mockRecordSecurityAuditLog = recordSecurityAuditLog as jest.Mock;
    const mockRevalidatePath = revalidatePath as jest.Mock;
    const mockRevalidateTag = revalidateTag as jest.Mock;

    let mockSupabase: {
        auth: { getUser: jest.Mock };
        from: jest.Mock;
    };

    let mockRange: jest.Mock;
    let mockOrder: jest.Mock;
    let mockEqFetch2: jest.Mock;

    let mockEqGetBook2: jest.Mock;
    let mockEqGetBook1: jest.Mock;

    let mockEqDelete2: jest.Mock;
    let mockEqDelete1: jest.Mock;
    let mockSelectDelete: jest.Mock;
    let mockDelete: jest.Mock;
    let mockFrom: jest.Mock;

    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockRange = jest.fn().mockResolvedValue({ data: [], error: null });
        mockOrder = jest.fn().mockReturnValue({ range: mockRange });
        mockEqFetch2 = jest.fn().mockReturnValue({ order: mockOrder });

        mockEqGetBook2 = jest
            .fn()
            .mockResolvedValue({ data: [{ book_id: 'book-1' }], error: null });
        mockEqGetBook1 = jest.fn().mockReturnValue({ eq: mockEqGetBook2 });

        mockSelectDelete = jest.fn().mockResolvedValue({ data: [{ id: 'rev-1' }], error: null });
        mockEqDelete2 = jest.fn().mockReturnValue({ select: mockSelectDelete });
        mockEqDelete1 = jest.fn().mockReturnValue({ eq: mockEqDelete2 });
        mockDelete = jest.fn().mockReturnValue({ eq: mockEqDelete1 });

        mockFrom = jest.fn().mockImplementation((table: string) => {
            if (table === 'book_reviews') {
                return {
                    select: jest.fn((query?: string) => {
                        if (query === 'book_id') {
                            return { eq: mockEqGetBook1 };
                        }
                        return { eq: mockEqFetch2 };
                    }),
                    delete: mockDelete,
                };
            }
            return {};
        });

        mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: {
                        user: { id: 'user-123' },
                    },
                    error: null,
                }),
            },
            from: mockFrom,
        };

        mockCreateBackendClient.mockResolvedValue(mockSupabase);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('fetchUserReviewsAction', () => {
        it('should return session expired when user is not authenticated with auth error', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Unauthorized' },
            });
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Auth Error');

            const result = await fetchUserReviewsAction(1);

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.objectContaining({
                    operation: 'fetchUserReviewsAction_auth_failed',
                    error: 'Sanitized Auth Error',
                }),
            );
            expect(result).toEqual({
                reviews: [],
                booksMap: {},
                hasMore: false,
                error: 'Session expired',
            });
        });

        it('should return session expired with default error when user is not authenticated and auth error is null', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.objectContaining({
                    operation: 'fetchUserReviewsAction_auth_failed',
                    error: 'Session expired',
                }),
            );
            expect(result).toEqual({
                reviews: [],
                booksMap: {},
                hasMore: false,
                error: 'Session expired',
            });
        });

        it('should handle database query error during fetch', async () => {
            mockRange.mockResolvedValueOnce({
                data: null,
                error: 'DB error',
            });

            const result = await fetchUserReviewsAction(1);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toEqual({
                reviews: [],
                booksMap: {},
                hasMore: false,
                error: 'DB error',
            });
        });

        it('should handle missing data during fetch with default error', async () => {
            mockRange.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toEqual({
                reviews: [],
                booksMap: {},
                hasMore: false,
                error: 'Failed to fetch reviews',
            });
        });

        it('should successfully fetch user reviews with no more items and map single book object', async () => {
            const mockReviewData = [
                {
                    id: 'rev-1',
                    book_id: 'book-1',
                    user_id: 'user-123',
                    username: 'testuser',
                    rating: 5,
                    review: 'Great!',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    books: { id: 'book-1', title: 'Book 1', author: 'Author 1' },
                },
            ];

            mockRange.mockResolvedValueOnce({
                data: mockReviewData,
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(result.hasMore).toBe(false);
            expect(result.reviews).toHaveLength(1);
            expect(result.booksMap['rev-1']).toEqual({
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
            });
            expect(result.error).toBeNull();
        });

        it('should successfully map books when books property is an array', async () => {
            const mockReviewData = [
                {
                    id: 'rev-2',
                    book_id: 'book-2',
                    user_id: 'user-123',
                    username: 'testuser',
                    rating: 4,
                    review: 'Good!',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    books: [{ id: 'book-2', title: 'Book 2', author: 'Author 2' }],
                },
            ];

            mockRange.mockResolvedValueOnce({
                data: mockReviewData,
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(result.booksMap['rev-2']).toEqual({
                id: 'book-2',
                title: 'Book 2',
                author: 'Author 2',
            });
        });

        it('should map null to booksMap when books property is missing or null (testing ?? null fallback)', async () => {
            const mockReviewData = [
                {
                    id: 'rev-3',
                    book_id: 'book-3',
                    user_id: 'user-123',
                    username: 'testuser',
                    rating: 3,
                    review: 'Okay',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    books: null,
                },
                {
                    id: 'rev-4',
                    book_id: 'book-4',
                    user_id: 'user-123',
                    username: 'testuser',
                    rating: 3,
                    review: 'Okay',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    books: [],
                },
            ];

            mockRange.mockResolvedValueOnce({
                data: mockReviewData,
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(result.booksMap['rev-3']).toBeNull();
            expect(result.booksMap['rev-4']).toBeNull();
        });

        it('should successfully fetch user reviews with more items (hasMore true)', async () => {
            const mockReviewData = Array.from({ length: 6 }, (_, index) => ({
                id: `rev-${index + 1}`,
                book_id: `book-${index + 1}`,
                user_id: 'user-123',
                username: 'testuser',
                rating: 5,
                review: 'Great!',
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
                books: { id: `book-${index + 1}`, title: `Book ${index + 1}`, author: 'Author' },
            }));

            mockRange.mockResolvedValueOnce({
                data: mockReviewData,
                error: null,
            });

            const result = await fetchUserReviewsAction(1);

            expect(result.hasMore).toBe(true);
            expect(result.reviews).toHaveLength(5);
            expect(result.booksMap['rev-1']).toEqual({
                id: 'book-1',
                title: 'Book 1',
                author: 'Author',
            });
        });
    });

    describe('deleteReviewAction', () => {
        it('should return success false when user is not authenticated with auth error', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Unauthorized' },
            });
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Auth Error');

            const result = await deleteReviewAction('rev-1');

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.objectContaining({
                    operation: 'deleteReviewAction_auth_failed',
                    error: 'Sanitized Auth Error',
                }),
            );
            expect(result).toEqual({ success: false, message: 'Session expired' });
        });

        it('should return success false when user is not authenticated and auth error is null', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            const result = await deleteReviewAction('rev-1');

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.objectContaining({
                    operation: 'deleteReviewAction_auth_failed',
                    error: 'Session expired',
                }),
            );
            expect(result).toEqual({ success: false, message: 'Session expired' });
        });

        it('should handle delete failure when delete result has explicit error', async () => {
            mockEqGetBook2.mockResolvedValueOnce({
                data: [{ book_id: 'book-1' }],
                error: null,
            });
            mockSelectDelete.mockResolvedValueOnce({
                data: [],
                error: 'Delete database error',
            });

            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Delete Error');

            const result = await deleteReviewAction('rev-1');

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toEqual({
                success: false,
                message: 'Sanitized Delete Error',
            });
        });

        it('should handle delete failure with default fallback message when error is null and data is empty', async () => {
            mockEqGetBook2.mockResolvedValueOnce({
                data: [{ book_id: 'book-1' }],
                error: null,
            });
            mockSelectDelete.mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await deleteReviewAction('rev-1');

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toEqual({
                success: false,
                message: 'Failed to delete review.',
            });
        });

        it('should successfully delete review and revalidate paths and tags', async () => {
            mockEqGetBook2.mockResolvedValueOnce({
                data: [{ book_id: 'book-1' }],
                error: null,
            });
            mockSelectDelete.mockResolvedValueOnce({
                data: [{ id: 'rev-1' }],
                error: null,
            });

            const result = await deleteReviewAction('rev-1');

            expect(result).toEqual({ success: true });
            expect(mockRevalidateTag).toHaveBeenCalledWith('reviews', 'max');
            expect(mockRevalidateTag).toHaveBeenCalledWith('books', 'max');
            expect(mockRevalidateTag).toHaveBeenCalledWith('reviews-book-1', 'max');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/user/content/reviews', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/book/[slug]', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/book/book-1', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'page');
        });
    });
});
