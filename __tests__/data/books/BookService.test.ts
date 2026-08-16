import { fetchBooksWithReviews } from '@/data/books/BookService';
import { BOOK_SORT_OPTIONS } from '@/data/books/BookConstants';
import { createPublicServerClient } from '@/utils/db/publicServer';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/cache', () => ({
    unstable_cache: jest.fn(
        <T extends (...args: unknown[]) => unknown>(fn: T) =>
            (...args: Parameters<T>) =>
                fn(...args),
    ),
}));

jest.mock('@/utils/db/publicServer', () => ({
    createPublicServerClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (fn: () => unknown) => await fn()),
}));

describe('fetchBooksWithReviews', () => {
    type SupabaseClientType = Awaited<ReturnType<typeof createPublicServerClient>>;
    const mockedCreatePublicServerClient = createPublicServerClient as unknown as jest.Mock<
        Promise<SupabaseClientType>,
        []
    >;
    const mockedSafeSupabaseQuery = safeSupabaseQuery as unknown as jest.Mock<
        Promise<unknown>,
        [() => unknown]
    >;

    interface MockSupabaseResponse {
        data: Record<string, unknown>[] | null;
        error: { code: string; message: string } | null;
        count: number;
    }

    interface MockSupabaseChain {
        select: jest.Mock<MockSupabaseChain, unknown[]>;
        eq: jest.Mock<MockSupabaseChain, unknown[]>;
        in: jest.Mock<MockSupabaseChain, unknown[]>;
        order: jest.Mock<MockSupabaseChain, unknown[]>;
        range: jest.Mock<MockSupabaseChain, unknown[]>;
        then: (
            onFulfilled?: ((value: MockSupabaseResponse) => unknown) | null,
            onRejected?: ((reason: unknown) => unknown) | null,
        ) => Promise<unknown>;
    }

    const setupSupabaseMock = (response: MockSupabaseResponse) => {
        const chain: MockSupabaseChain = {
            select: jest.fn(),
            eq: jest.fn(),
            in: jest.fn(),
            order: jest.fn(),
            range: jest.fn(),
            then: (onFulfilled, onRejected) =>
                Promise.resolve(response).then(onFulfilled, onRejected),
        };

        chain.select.mockReturnValue(chain);
        chain.eq.mockReturnValue(chain);
        chain.in.mockReturnValue(chain);
        chain.order.mockReturnValue(chain);
        chain.range.mockReturnValue(chain);

        const supabaseClient = {
            from: jest.fn().mockReturnValue(chain),
        };

        return { supabaseClient, chain };
    };

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock<unknown, unknown[]>).mockRestore();
        (console.warn as jest.Mock<unknown, unknown[]>).mockRestore();
    });

    it('should use the wildcard review selector and filter by id when bookID is provided', async () => {
        const testID = 'specific-book-id';
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        await fetchBooksWithReviews({ bookID: testID });

        expect(supabaseClient.from).toHaveBeenCalledWith('books_with_stats');
        expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('book_reviews(*)'), {
            count: 'exact',
        });
        expect(chain.eq).toHaveBeenCalledWith('id', testID);
    });

    it('should use the limited review selector when no bookID is provided', async () => {
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        await fetchBooksWithReviews({});

        expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('book_reviews(rating)'), {
            count: 'exact',
        });
    });

    it('should handle books with null or empty reviews and set rating to 0', async () => {
        const mockRawData = [
            { id: '1', title: 'Book Null Reviews', book_reviews: null },
            { id: '2', title: 'Book Empty Reviews', book_reviews: [] },
        ];

        const { supabaseClient } = setupSupabaseMock({
            data: mockRawData,
            error: null,
            count: 2,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        const result = await fetchBooksWithReviews();

        const book1 = result.data?.data[0] as unknown as { rating: number };
        const book2 = result.data?.data[1] as unknown as { rating: number };

        expect(book1.rating).toBe(0);
        expect(book2.rating).toBe(0);
        expect(result.error).toBeNull();
    });

    it('should apply the "in" filter when multiple bookIDs are provided', async () => {
        const ids = ['id-1', 'id-2'];
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        await fetchBooksWithReviews({ bookIDs: ids });

        expect(chain.in).toHaveBeenCalledWith('id', ids);
    });

    it('should apply group and type filtering', async () => {
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        await fetchBooksWithReviews({ group: 'genre', type: 'Fantasy' });

        expect(chain.eq).toHaveBeenCalledWith('genre', 'Fantasy');
    });

    it('should handle missing rating values within a review object', async () => {
        const mockRawData = [
            {
                id: '1',
                title: 'Partial Ratings',
                book_reviews: [
                    { rating: 4 },
                    { rating: undefined } as unknown as { rating: number },
                ],
            },
        ];

        const { supabaseClient } = setupSupabaseMock({
            data: mockRawData,
            error: null,
            count: 1,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        const result = await fetchBooksWithReviews();

        const book = result.data?.data[0] as unknown as { rating: number };

        expect(book.rating).toBeGreaterThanOrEqual(0);
    });

    it('should return a successful empty state when error code is PGRST116', async () => {
        const { supabaseClient } = setupSupabaseMock({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        const result = await fetchBooksWithReviews();

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should catch database errors and return a specific friendly message', async () => {
        const { supabaseClient } = setupSupabaseMock({
            data: null,
            error: { code: 'PGRST999', message: 'Database failure' },
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        const result = await fetchBooksWithReviews();

        expect(result.error).toBeDefined();
    });

    it('should handle non-Error objects thrown during execution', async () => {
        const literalError = 'A literal string exception';
        mockedCreatePublicServerClient.mockImplementation(() => {
            throw literalError;
        });

        const result = await fetchBooksWithReviews();

        expect(result.error).toBe(sanitizeSupabaseError(literalError));
    });

    it('should handle Error objects thrown during execution', async () => {
        const errorMessage = 'Database connection timeout';
        const errorObj = new Error(errorMessage);
        mockedCreatePublicServerClient.mockImplementation(() => {
            throw errorObj;
        });

        const result = await fetchBooksWithReviews();

        expect(result.error).toBe(sanitizeSupabaseError(errorObj));
    });

    it('should return empty data when the database returns null', async () => {
        const { supabaseClient } = setupSupabaseMock({
            data: null,
            error: null,
            count: 0,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        const result = await fetchBooksWithReviews();

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should return empty paginated response when result.data is falsy', async () => {
        mockedSafeSupabaseQuery.mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await fetchBooksWithReviews();

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should apply sorting and pagination to the builder chain', async () => {
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 10,
        });

        mockedCreatePublicServerClient.mockResolvedValue(
            supabaseClient as unknown as SupabaseClientType,
        );

        await fetchBooksWithReviews({
            sortBy: BOOK_SORT_OPTIONS.PRICE_HIGH,
            page: 1,
            limit: 5,
        });

        expect(chain.order).toHaveBeenCalledWith('price', { ascending: false });
        expect(chain.range).toHaveBeenCalledWith(0, 4);
    });

    it('should handle page parameter less than 1', async () => {
        const result = await fetchBooksWithReviews({ page: 0 });

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should handle limit parameter less than 1', async () => {
        const result = await fetchBooksWithReviews({ limit: 0 });

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('should handle limit parameter greater than maximum', async () => {
        const result = await fetchBooksWithReviews({ limit: 100 });

        expect(result.data?.data).toEqual([]);
        expect(result.error).toBeNull();
    });
});
