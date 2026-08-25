import { UserReviewAction } from '@/data/books/reviews/ReviewAction';
import { createBackendClient } from '@/utils/db/server';
import { mapToReviewPayload } from '@/data/books/reviews/ReviewMapper';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { revalidatePath, revalidateTag } from 'next/cache';
import { resolveUsername, isDuplicateReviewError } from '@/data/books/reviews/ReviewActionUtils';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    BookAdvancedFilteringProvider: ({ children }: { children: React.ReactNode }) => children,
    useBookAdvancedFiltering: jest.fn().mockReturnValue({
        advancedFilters: [],
        isLoading: false,
    }),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/data/books/reviews/ReviewMapper', () => ({
    mapToReviewPayload: jest.fn(),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => {
        return queryFn();
    }),
}));

jest.mock('@/data/books/reviews/ReviewActionUtils', () => ({
    resolveUsername: jest.fn(),
    isDuplicateReviewError: jest.fn(),
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
    const mockResolveUsername = resolveUsername as jest.Mock;
    const mockIsDuplicateReviewError = isDuplicateReviewError as jest.Mock;
    const mockRevalidatePath = revalidatePath as jest.Mock;
    const mockRevalidateTag = revalidateTag as jest.Mock;

    let mockSupabase: {
        auth: { getUser: jest.Mock };
        from: jest.Mock;
    };
    let mockSelect: jest.Mock;
    let mockEq2: jest.Mock;
    let mockEq1: jest.Mock;
    let mockUpdate: jest.Mock;
    let mockInsert: jest.Mock;
    let mockFrom: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeAll(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockSelect = jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
        mockEq2 = jest.fn().mockReturnValue({ select: mockSelect });
        mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2, select: mockSelect });
        mockUpdate = jest.fn().mockReturnValue({ eq: mockEq1 });
        mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
        mockFrom = jest.fn().mockReturnValue({
            update: mockUpdate,
            insert: mockInsert,
        });

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
            from: mockFrom,
        };

        mockCreateBackendClient.mockResolvedValue(mockSupabase);
        mockMapToReviewPayload.mockReturnValue({ rating: 5, review: 'Great book!' });
        mockResolveUsername.mockResolvedValue('dbuser');
        mockIsDuplicateReviewError.mockReturnValue(false);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('should return initial state when reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'true');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, validationErrors: [] });
    });

    it('should return validation error when bookId is missing', async () => {
        const formData = new FormData();
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
    });

    it('should return validation errors when schema validation fails', async () => {
        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', 'invalid');
        formData.append('review', '');

        const result = await UserReviewAction(undefined, formData);
        expect(result.validationErrors).toBeDefined();
    });

    it('should return session expired when user is not authenticated with auth error', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Unauthorized' },
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            null,
            expect.objectContaining({
                error: 'Sanitized Error',
            }),
        );
        expect(result.message).toBeDefined();
    });

    it('should return session expired with default message when user is not authenticated and auth error is null', async () => {
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
            expect.objectContaining({
                error: 'Session expired',
            }),
        );
        expect(result.message).toBeDefined();
    });

    it('should successfully insert a new review', async () => {
        mockSelect.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');
        formData.append('username', 'testuser');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, validationErrors: [] });
        expect(mockRevalidatePath).toHaveBeenCalled();
        expect(mockRevalidateTag).toHaveBeenCalled();
    });

    it('should successfully update an existing review', async () => {
        mockSelect.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('reviewId', 'rev-1');
        formData.append('slug', 'test-slug');
        formData.append('rating', '5');
        formData.append('review', 'Updated review');

        const result = await UserReviewAction(undefined, formData);
        expect(result).toEqual({ message: null, validationErrors: [] });
        expect(mockRevalidatePath).toHaveBeenCalledWith('/book/test-slug', 'page');
    });

    it('should handle update failure when update result has explicit error', async () => {
        mockSelect.mockResolvedValueOnce({
            data: [],
            error: 'Database update error',
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('reviewId', 'rev-1');
        formData.append('rating', '5');
        formData.append('review', 'Updated review');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle update failure with default fallback message when error is null and data is empty', async () => {
        mockSelect.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('reviewId', 'rev-1');
        formData.append('rating', '5');
        formData.append('review', 'Updated review');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle insert failure when insert result has explicit error', async () => {
        mockSelect.mockResolvedValueOnce({
            data: [],
            error: 'Database insert error',
        });
        mockIsDuplicateReviewError.mockReturnValue(false);

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle insert failure with default fallback message when error is null and data is empty', async () => {
        mockSelect.mockResolvedValueOnce({
            data: [],
            error: null,
        });
        mockIsDuplicateReviewError.mockReturnValue(false);

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle duplicate review error during insert', async () => {
        mockSelect.mockResolvedValueOnce({
            data: null,
            error: { code: '23505', message: 'MAP_23505' },
        });
        mockIsDuplicateReviewError.mockReturnValue(true);

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        const result = await UserReviewAction(undefined, formData);
        expect(result.message).toBeDefined();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should rethrow NEXT_REDIRECT error', async () => {
        mockMapToReviewPayload.mockImplementationOnce(() => {
            throw new Error('NEXT_REDIRECT');
        });

        const formData = new FormData();
        formData.append('bookId', 'book-123');
        formData.append('rating', '5');
        formData.append('review', 'Great book!');

        await expect(UserReviewAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('should handle unexpected exceptions', async () => {
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
