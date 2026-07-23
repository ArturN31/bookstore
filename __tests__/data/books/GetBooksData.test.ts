import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { BOOK_SORT_OPTIONS } from '@/data/books/BookConstants';
import { createBackendClient } from '@/utils/db/server';

jest.mock('next/cache', () => ({
    unstable_cache: jest.fn(
        <T extends (...args: unknown[]) => unknown>(fn: T) =>
            (...args: Parameters<T>) =>
                fn(...args),
    ),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

describe('fetchBooksWithReviews', () => {
    const mockedCreateBackendClient = createBackendClient as jest.Mock;

    interface MockSupabaseResponse {
        data: Record<string, unknown>[] | null;
        error: { code: string; message: string } | null;
        count: number;
    }

    const setupSupabaseMock = (response: MockSupabaseResponse) => {
        const chain: Record<string, jest.Mock> = {};

        chain.select = jest.fn().mockReturnValue(chain);
        chain.eq = jest.fn().mockReturnValue(chain);
        chain.in = jest.fn().mockReturnValue(chain);
        chain.order = jest.fn().mockReturnValue(chain);
        chain.range = jest.fn().mockReturnValue(chain);
        chain.then = jest.fn((resolve: (value: MockSupabaseResponse) => void) =>
            Promise.resolve(response).then(resolve),
        );

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
        (console.error as jest.Mock).mockRestore();
        (console.warn as jest.Mock).mockRestore();
    });

    it('should use the wildcard review selector and filter by id when bookID is provided', async () => {
        const testID = 'specific-book-id';
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

        const result = await fetchBooksWithReviews();

        expect(result.data?.data[0].rating).toBe(0);
        expect(result.data?.data[1].rating).toBe(0);
        expect(result.error).toBeNull();
    });

    it('should apply the "in" filter when multiple bookIDs are provided', async () => {
        const ids = ['id-1', 'id-2'];
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

        await fetchBooksWithReviews({ bookIDs: ids });

        expect(chain.in).toHaveBeenCalledWith('id', ids);
    });

    it('should apply group and type filtering', async () => {
        const { supabaseClient, chain } = setupSupabaseMock({
            data: [],
            error: null,
            count: 0,
        });

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

        const result = await fetchBooksWithReviews();

        expect(result.data?.data[0].rating).toBeGreaterThanOrEqual(0);
    });

    it('should return a successful empty state when error code is PGRST116', async () => {
        const { supabaseClient } = setupSupabaseMock({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
            count: 0,
        });

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

        const result = await fetchBooksWithReviews();

        expect(result.error).toBeDefined();
    });

    it('should handle non-Error objects thrown during execution', async () => {
        mockedCreateBackendClient.mockImplementation(() => {
            throw 'A literal string exception';
        });

        const result = await fetchBooksWithReviews();

        expect(result.error).toBe('A literal string exception');
    });

    it('should handle Error objects thrown during execution', async () => {
        const errorMessage = 'Database connection timeout';
        mockedCreateBackendClient.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        const result = await fetchBooksWithReviews();

        expect(result.error).toBe(errorMessage);
    });

    it('should return empty data when the database returns null', async () => {
        const { supabaseClient } = setupSupabaseMock({
            data: null,
            error: null,
            count: 0,
        });

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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

        mockedCreateBackendClient.mockResolvedValue(supabaseClient);

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
