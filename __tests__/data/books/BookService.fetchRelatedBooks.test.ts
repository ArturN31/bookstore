import { fetchRelatedBooks } from '@/data/books/BookService';
import { getRelatedBooksQuery } from '@/data/books/BookRepository';
import { createPublicServerClient } from '@/utils/db/publicServer';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { Tables } from '@/database.types';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('@/data/books/BookRepository', () => ({
    ...jest.requireActual('@/data/books/BookRepository'),
    getRelatedBooksQuery: jest.fn(),
    getBestsellersQuery: jest.fn(),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/cache', () => ({
    unstable_cache: jest.fn(
        <T extends (...args: unknown[]) => unknown>(fn: T) =>
            (...args: Parameters<T>): ReturnType<T> =>
                fn(...args) as ReturnType<T>,
    ),
}));

jest.mock('@/utils/db/publicServer', () => ({
    createPublicServerClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (fn: () => unknown) => await fn()),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
}));

describe('BookService.fetchRelatedBooks', () => {
    type SupabaseClientType = Awaited<ReturnType<typeof createPublicServerClient>>;
    const mockedCreatePublicServerClient = createPublicServerClient as unknown as jest.Mock<
        Promise<SupabaseClientType>,
        []
    >;
    const mockedGetRelatedBooksQuery = getRelatedBooksQuery as unknown as jest.Mock<
        Promise<{
            data: Tables<'books_with_stats'>[] | null | undefined;
            error: { code: string; message: string } | null;
        }>,
        [SupabaseClientType, string, number]
    >;
    const mockedSafeSupabaseQuery = safeSupabaseQuery as unknown as jest.Mock<
        Promise<unknown>,
        [() => unknown]
    >;
    const mockedVerifyRateLimit = verifyRateLimit as jest.Mock;

    const mockBook: Tables<'books_with_stats'> = {
        id: 'book-1',
        title: 'Sample Related Book',
    } as Tables<'books_with_stats'>;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockedVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 30,
            remaining: 29,
            reset: Date.now() + 60000,
        });
    });

    afterEach(() => {
        (console.error as jest.Mock<unknown, unknown[]>).mockRestore();
        (console.warn as jest.Mock<unknown, unknown[]>).mockRestore();
    });

    it('should return rate limit error when rate limit is exceeded', async () => {
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60000,
            error: 'Too many related-book requests. Please slow down.',
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result.error).toBe('Too many related-book requests. Please slow down.');
        expect(result.data).toBeNull();
        expect(mockedCreatePublicServerClient).not.toHaveBeenCalled();
    });

    it('should fallback to default rate limit message when error is undefined', async () => {
        mockedVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60000,
            error: undefined,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result.error).toBe('Too many related-book requests. Please slow down.');
        expect(result.data).toBeNull();
    });

    it('should return empty data array when bookId is an empty string', async () => {
        const result = await fetchRelatedBooks('');

        expect(result).toEqual({
            data: [],
            error: null,
        });
        expect(mockedCreatePublicServerClient).not.toHaveBeenCalled();
    });

    it('should fetch related books successfully with default limit (evaluates truthy result.data)', async () => {
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedGetRelatedBooksQuery.mockResolvedValue({
            data: [mockBook],
            error: null,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(mockedCreatePublicServerClient).toHaveBeenCalledTimes(1);
        expect(mockedGetRelatedBooksQuery).toHaveBeenCalledWith(mockSupabase, 'book-1', 12);
        expect(result).toEqual({
            data: [mockBook],
            error: null,
        });
    });

    it('should pass custom limit to getRelatedBooksQuery', async () => {
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedGetRelatedBooksQuery.mockResolvedValue({
            data: [mockBook],
            error: null,
        });

        const result = await fetchRelatedBooks('book-1', 5);

        expect(mockedGetRelatedBooksQuery).toHaveBeenCalledWith(mockSupabase, 'book-1', 5);
        expect(result.data).toEqual([mockBook]);
        expect(result.error).toBeNull();
    });

    it('should return empty array when query returns null data (evaluates fallback || [])', async () => {
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedGetRelatedBooksQuery.mockResolvedValue({
            data: null,
            error: null,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result).toEqual({
            data: [],
            error: null,
        });
    });

    it('should return empty array when query returns undefined data (evaluates fallback || [])', async () => {
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedGetRelatedBooksQuery.mockResolvedValue({
            data: undefined,
            error: null,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result).toEqual({
            data: [],
            error: null,
        });
    });

    it('should return empty array when safeSupabaseQuery returns result with falsy data property', async () => {
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedSafeSupabaseQuery.mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result).toEqual({
            data: [],
            error: null,
        });
    });

    it('should handle query error and return sanitized error', async () => {
        const mockError = { code: 'PGRST100', message: 'Query failed' };
        const mockSupabase = {} as SupabaseClientType;
        mockedCreatePublicServerClient.mockResolvedValue(mockSupabase);
        mockedGetRelatedBooksQuery.mockResolvedValue({
            data: null,
            error: mockError,
        });

        const result = await fetchRelatedBooks('book-1');

        expect(result).toEqual({
            data: null,
            error: sanitizeSupabaseError(mockError),
        });
    });

    it('should catch thrown errors and return sanitized error response', async () => {
        const thrownError = new Error('Connection error');
        mockedCreatePublicServerClient.mockRejectedValue(thrownError);

        const result = await fetchRelatedBooks('book-1');

        expect(console.error).toHaveBeenCalledWith(
            '[BookService] Related Books Error:',
            thrownError,
        );
        expect(result).toEqual({
            data: null,
            error: sanitizeSupabaseError(thrownError),
        });
    });
});
