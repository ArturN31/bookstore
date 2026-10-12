import {
    DEFAULT_FILTERING_CONSTANTS,
    CATEGORY_LABELS,
    NUMERIC_CATEGORIES,
} from '@/data/advancedFiltering/FilteringConstants';
import { getFilteringConstants } from '@/data/advancedFiltering/FilteringConstantsAction';
import { createBackendClient } from '@/utils/db/server';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';
import { act } from '@testing-library/react';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
}));

const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (typeof message === 'string' && message.includes('[SecurityAudit]')) {
                return;
            }
            originalWarn(message, ...optionalParams);
        },
    );

    jest.spyOn(console, 'error').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (
                typeof message === 'string' &&
                message.includes('Failed to load filter constants')
            ) {
                return;
            }
            originalError(message, ...optionalParams);
        },
    );
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('FilteringConstants', () => {
    const mockVerifyRateLimit = jest.mocked(verifyRateLimit);
    type BackendClientType = Awaited<ReturnType<typeof createBackendClient>>;
    const mockCreateBackendClient = createBackendClient as unknown as jest.Mock<
        Promise<BackendClientType>,
        []
    >;

    beforeEach(() => {
        jest.clearAllMocks();
        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });
    });

    describe('getFilteringConstants', () => {
        it('should fail closed before reading book filters when rate limited', async () => {
            mockVerifyRateLimit.mockResolvedValueOnce({
                success: false,
                limit: 60,
                remaining: 0,
                reset: Date.now() + 60000,
            });

            await expect(getFilteringConstants()).rejects.toThrow(
                'Too many filter requests. Please try again later.',
            );
            expect(mockCreateBackendClient).not.toHaveBeenCalled();
            expect(mockVerifyRateLimit).toHaveBeenCalledWith({
                identifier: 'ip:203.0.113.1',
                limiter: limiters.search,
                failClosed: true,
            });
        });

        it('should fetch and process unique filter values correctly from Supabase', async () => {
            const mockData = [
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
            ];

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: (
                    resolve: (value: { data: typeof mockData; error: null }) => void,
                    reject?: (reason: unknown) => void,
                ) => {
                    Promise.resolve({ data: mockData, error: null }).then(resolve, reject);
                },
            };

            const mockFrom = jest.fn().mockReturnValue(mockQueryBuilder);

            mockCreateBackendClient.mockResolvedValue({
                from: mockFrom,
            } as unknown as BackendClientType);

            let result!: Awaited<ReturnType<typeof getFilteringConstants>>;
            await act(async () => {
                result = await getFilteringConstants();
            });

            expect(result.AUTHORS).toEqual(['Author A']);
            expect(result.FORMATS).toEqual(['Paperback', 'Hardcover']);
            expect(result.GENRES).toEqual(['Fiction']);
            expect(result.PAGES).toEqual([100, 150]);
            expect(result.PRICES).toEqual([10.99, 15.99]);
            expect(result.PUBLICATIONS).toEqual(['2023-01-01']);
            expect(result.PUBLISHERS).toEqual(['Publisher X', 'Publisher Y']);
        });

        it('should return default constants when supabase returns an error', async () => {
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: (
                    resolve: (value: { data: null; error: { message: string } }) => void,
                    reject?: (reason: unknown) => void,
                ) => {
                    Promise.resolve({ data: null, error: { message: 'Database error' } }).then(
                        resolve,
                        reject,
                    );
                },
            };

            const mockFrom = jest.fn().mockReturnValue(mockQueryBuilder);

            mockCreateBackendClient.mockResolvedValue({
                from: mockFrom,
            } as unknown as BackendClientType);

            let result!: Awaited<ReturnType<typeof getFilteringConstants>>;
            await act(async () => {
                result = await getFilteringConstants();
            });

            expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
            expect(console.error).toHaveBeenCalled();
        });

        it('should return default constants when data is null', async () => {
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: (
                    resolve: (value: { data: null; error: null }) => void,
                    reject?: (reason: unknown) => void,
                ) => {
                    Promise.resolve({ data: null, error: null }).then(resolve, reject);
                },
            };

            const mockFrom = jest.fn().mockReturnValue(mockQueryBuilder);

            mockCreateBackendClient.mockResolvedValue({
                from: mockFrom,
            } as unknown as BackendClientType);

            let result!: Awaited<ReturnType<typeof getFilteringConstants>>;
            await act(async () => {
                result = await getFilteringConstants();
            });

            expect(result).toEqual(DEFAULT_FILTERING_CONSTANTS);
            expect(console.error).toHaveBeenCalled();
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
