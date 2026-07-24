import {
    getFilteringConstants,
    DEFAULT_FILTERING_CONSTANTS,
    CATEGORY_LABELS,
    NUMERIC_CATEGORIES,
} from '@/data/advancedFiltering/FilteringConstants';
import { createFrontendClient } from '@/utils/db/client';

jest.mock('@/utils/db/client', () => ({
    createFrontendClient: jest.fn(),
}));

describe('FilteringConstants', () => {
    const mockCreateFrontendClient = createFrontendClient as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFilteringConstants', () => {
        it('should fetch and process unique filter values correctly from Supabase', async () => {
            const mockSelect = jest.fn().mockResolvedValue({
                data: [
                    {
                        author: 'Author A',
                        format: 'Paperback',
                        genre: 'Fiction',
                        page_count: 100,
                        price: 10.99,
                        publication_date: '2023-01-01',
                        publisher: 'Publisher X',
                    },
                    {
                        author: 'Author A',
                        format: 'Hardcover',
                        genre: 'Fiction',
                        page_count: 150,
                        price: 15.99,
                        publication_date: '2023-01-01',
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

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            mockCreateFrontendClient.mockResolvedValue({
                from: mockFrom,
            });

            const result = await getFilteringConstants();

            expect(result.AUTHORS).toEqual(['Author A']);
            expect(result.FORMATS).toEqual(['Paperback', 'Hardcover']);
            expect(result.GENRES).toEqual(['Fiction']);
            expect(result.PAGES).toEqual([100, 150]);
            expect(result.PRICES).toEqual([10.99, 15.99]);
            expect(result.PUBLICATIONS).toEqual(['2023-01-01']);
            expect(result.PUBLISHERS).toEqual(['Publisher X', 'Publisher Y']);
        });

        it('should return default constants when supabase returns an error', async () => {
            const mockSelect = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            mockCreateFrontendClient.mockResolvedValue({
                from: mockFrom,
            });

            const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await getFilteringConstants();

            expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
            expect(spyConsoleError).toHaveBeenCalled();

            spyConsoleError.mockRestore();
        });

        it('should return default constants when data is null', async () => {
            const mockSelect = jest.fn().mockResolvedValue({
                data: null,
                error: null,
            });

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            mockCreateFrontendClient.mockResolvedValue({
                from: mockFrom,
            });

            const result = await getFilteringConstants();

            expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
        });
    });

    describe('Constants and labels', () => {
        it('should have correct category labels and numeric categories defined', () => {
            expect(CATEGORY_LABELS.AUTHORS).toBe('Authors');
            expect(NUMERIC_CATEGORIES).toContain('PAGES');
            expect(NUMERIC_CATEGORIES).toContain('PRICES');
        });
    });
});
