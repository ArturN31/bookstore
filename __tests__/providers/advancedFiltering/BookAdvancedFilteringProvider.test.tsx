import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
    getFilteringConstants,
} from '@/data/advancedFiltering/FilteringConstants';
import {
    BookAdvancedFilteringProvider,
    useBookFilter,
} from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

const mockFetchedFilters: FilteringTypes = {
    AUTHORS: ['Author B'],
    FORMATS: [],
    GENRES: ['Sci-Fi', 'Fantasy'],
    PAGES: [],
    PRICES: [],
    PUBLICATIONS: ['2022'],
    PUBLISHERS: [],
};

jest.mock('@/data/advancedFiltering/FilteringConstants', () => {
    const originalModule = jest.requireActual('@/data/advancedFiltering/FilteringConstants');
    return {
        ...originalModule,
        DEFAULT_FILTERING_CONSTANTS: {
            AUTHORS: ['Author A'],
            FORMATS: [],
            GENRES: ['Fiction', 'Non-Fiction'],
            PAGES: [],
            PRICES: [],
            PUBLICATIONS: ['2020', '2021'],
            PUBLISHERS: [],
        },
        getFilteringConstants: jest.fn(),
    };
});

describe('BookAdvancedFilteringProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createWrapper = (initialFilters?: FilteringTypes) => {
        const TestWrapper = ({ children }: { children: ReactNode }) => (
            <BookAdvancedFilteringProvider initialFilters={initialFilters}>
                {children}
            </BookAdvancedFilteringProvider>
        );
        TestWrapper.displayName = 'TestWrapper';
        return TestWrapper;
    };

    describe('useBookFilter Hook', () => {
        it('should throw an error when used outside of BookAdvancedFilteringProvider', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useBookFilter());
            }).toThrow('useBookFilter must be used within a BookAdvancedFilteringProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Initialization & Async Fetching', () => {
        it('should initialize with provided initialFilters without triggering fetch', () => {
            const wrapper = createWrapper(mockFetchedFilters);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            expect(result.current.isLoading).toBe(false);
            expect(result.current.advancedFilters).toEqual(mockFetchedFilters);
            expect(result.current.chosenFilters).toEqual(DEFAULT_FILTERING_CONSTANTS);
            expect(getFilteringConstants).not.toHaveBeenCalled();
        });

        it('should fetch filtering constants on mount if initialFilters is not provided', async () => {
            (getFilteringConstants as jest.Mock).mockResolvedValueOnce(mockFetchedFilters);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(getFilteringConstants).toHaveBeenCalledTimes(1);
            expect(result.current.advancedFilters).toEqual(mockFetchedFilters);
            expect(result.current.chosenFilters).toEqual(DEFAULT_FILTERING_CONSTANTS);
        });

        it('should handle fetch errors gracefully and update loading state', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockError = new Error('Network Error');
            (getFilteringConstants as jest.Mock).mockRejectedValueOnce(mockError);

            const wrapper = createWrapper();
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to fetch filtering constants:',
                mockError,
            );
            expect(result.current.advancedFilters).toEqual(DEFAULT_FILTERING_CONSTANTS);

            consoleSpy.mockRestore();
        });

        it('should not update state after unmounting during fetch operation', async () => {
            let resolvePromise!: (value: FilteringTypes) => void;
            const asyncPromise = new Promise<FilteringTypes>((resolve) => {
                resolvePromise = resolve;
            });

            (getFilteringConstants as jest.Mock).mockReturnValueOnce(asyncPromise);

            const wrapper = createWrapper();
            const { result, unmount } = renderHook(() => useBookFilter(), { wrapper });

            expect(result.current.isLoading).toBe(true);

            unmount();

            await act(async () => {
                resolvePromise(mockFetchedFilters);
            });
        });
    });

    describe('Filter Actions', () => {
        it('should set category filter directly via setCategoryFilter', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setCategoryFilter('GENRES', ['Fantasy']);
            });

            expect(result.current.chosenFilters.GENRES).toEqual(['Fantasy']);
        });

        it('should toggle items on and off using toggleFilterItem', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setCategoryFilter('GENRES', ['Fiction']);
            });

            act(() => {
                result.current.toggleFilterItem('GENRES', 'History');
            });

            expect(result.current.chosenFilters.GENRES).toEqual(['Fiction', 'History']);

            act(() => {
                result.current.toggleFilterItem('GENRES', 'Fiction');
            });

            expect(result.current.chosenFilters.GENRES).toEqual(['History']);
        });

        it('should handle non-array initial category state gracefully when calling toggleFilterItem', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setCategoryFilter(
                    'GENRES',
                    null as unknown as FilteringTypes['GENRES'],
                );
            });

            act(() => {
                result.current.toggleFilterItem('GENRES', 'Sci-Fi');
            });

            expect(result.current.chosenFilters.GENRES).toEqual(['Sci-Fi']);
        });

        it('should handle numeric items accurately in toggleFilterItem', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setCategoryFilter('PAGES', [100]);
            });

            act(() => {
                result.current.toggleFilterItem('PAGES', 200);
            });

            expect(result.current.chosenFilters.PAGES).toEqual([100, 200]);

            act(() => {
                result.current.toggleFilterItem('PAGES', 100);
            });

            expect(result.current.chosenFilters.PAGES).toEqual([200]);
        });

        it('should allow manual updating of state using setAdvancedFilters and setChosenFilters', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setAdvancedFilters(mockFetchedFilters);
                result.current.setChosenFilters(mockFetchedFilters);
            });

            expect(result.current.advancedFilters).toEqual(mockFetchedFilters);
            expect(result.current.chosenFilters).toEqual(mockFetchedFilters);
        });

        it('should reset chosen filters to defaults when resetAllFilters is invoked', () => {
            const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
            const { result } = renderHook(() => useBookFilter(), { wrapper });

            act(() => {
                result.current.setCategoryFilter('GENRES', ['Horror']);
            });

            expect(result.current.chosenFilters.GENRES).toEqual(['Horror']);

            act(() => {
                result.current.resetAllFilters();
            });

            expect(result.current.chosenFilters).toEqual(DEFAULT_FILTERING_CONSTANTS);
        });
    });
});
