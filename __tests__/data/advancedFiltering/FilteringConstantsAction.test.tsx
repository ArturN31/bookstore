import { createBackendClient } from '@/utils/db/server';
import { verifyRateLimit } from '@/utils/network/rateLimiter';
import { getFilteringConstants } from '@/data/advancedFiltering/FilteringConstantsAction';
import { DEFAULT_FILTERING_CONSTANTS } from '@/data/advancedFiltering/FilteringConstants';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => queryFn()),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
}));

describe('FilteringService.getFilteringConstants', () => {
    const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
        typeof createBackendClient
    >;
    const mockVerifyRateLimit = verifyRateLimit as jest.MockedFunction<typeof verifyRateLimit>;

    let mockSelect: jest.Mock;
    let mockEq: jest.Mock;
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

        mockEq = jest.fn().mockResolvedValue({
            data: [
                {
                    author: 'Author A',
                    format: 'Hardcover',
                    genre: 'Fantasy',
                    page_count: 350,
                    price: 19.99,
                    publication_date: '2026-01-01',
                    publisher: 'Publisher X',
                },
                {
                    author: 'Author A',
                    format: 'Paperback',
                    genre: 'Sci-Fi',
                    page_count: 400,
                    price: 14.99,
                    publication_date: '2026-02-01',
                    publisher: 'Publisher Y',
                },
                {
                    author: null,
                    format: null,
                    genre: null,
                    page_count: null,
                    price: null,
                    publication_date: null,
                    publisher: null,
                },
            ],
            error: null,
        });

        mockSelect = jest.fn().mockReturnValue({
            eq: mockEq,
        });

        mockFrom = jest.fn().mockReturnValue({
            select: mockSelect,
        });

        mockCreateBackendClient.mockResolvedValue({
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createBackendClient>>);

        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 30,
            remaining: 29,
            reset: Date.now() + 60000,
        });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should throw an error when rate limit is exceeded', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60000,
            error: 'Too many filter requests. Please try again later.',
        });

        await expect(getFilteringConstants()).resolves.toBe(DEFAULT_FILTERING_CONSTANTS);
        expect(mockCreateBackendClient).not.toHaveBeenCalled();
    });

    it('should fallback to default rate limit error message when error is undefined', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60000,
            error: undefined,
        });

        await expect(getFilteringConstants()).resolves.toBe(DEFAULT_FILTERING_CONSTANTS);
        expect(mockCreateBackendClient).not.toHaveBeenCalled();
    });

    it('should successfully fetch, deduplicate, and return filtering constants', async () => {
        const result = await getFilteringConstants();

        expect(result).toEqual({
            AUTHORS: ['Author A'],
            FORMATS: ['Hardcover', 'Paperback'],
            GENRES: ['Fantasy', 'Sci-Fi'],
            PAGES: [350, 400],
            PRICES: [19.99, 14.99],
            PUBLICATIONS: ['2026-01-01', '2026-02-01'],
            PUBLISHERS: ['Publisher X', 'Publisher Y'],
        });
        expect(mockFrom).toHaveBeenCalledWith('books');
        expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should fall back to query without eq when eq is not a function', async () => {
        mockSelect.mockReturnValueOnce(
            Promise.resolve({
                data: [
                    {
                        author: 'Author B',
                        format: 'EBook',
                        genre: 'Mystery',
                        page_count: 200,
                        price: 9.99,
                        publication_date: '2026-03-01',
                        publisher: 'Publisher Z',
                    },
                ],
                error: null,
            }),
        );

        const result = await getFilteringConstants();

        expect(result).toEqual({
            AUTHORS: ['Author B'],
            FORMATS: ['EBook'],
            GENRES: ['Mystery'],
            PAGES: [200],
            PRICES: [9.99],
            PUBLICATIONS: ['2026-03-01'],
            PUBLISHERS: ['Publisher Z'],
        });
    });

    it('should return default filtering constants and log error when query result has an error', async () => {
        mockEq.mockResolvedValueOnce({
            data: null,
            error: 'Database error',
        });

        const result = await getFilteringConstants();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to load filter constants:',
            'Database error',
        );
        expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
    });

    it('should return default filtering constants and log error when query result data is null', async () => {
        mockEq.mockResolvedValueOnce({
            data: null,
            error: null,
        });

        const result = await getFilteringConstants();

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
    });
});
