import { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import {
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
} from '@/data/advancedFiltering/FilteringConstants';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { BookAdvancedFilteringProvider } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

describe('useCategoryFilter', () => {
    const createWrapper = (initialFilters?: FilteringTypes) => {
        const TestWrapper = ({ children }: { children: ReactNode }) => (
            <BookAdvancedFilteringProvider initialFilters={initialFilters}>
                {children}
            </BookAdvancedFilteringProvider>
        );
        TestWrapper.displayName = 'TestWrapper';
        return TestWrapper;
    };

    it('should return the correct initial category value', () => {
        const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
        const { result } = renderHook(() => useCategoryFilter('GENRES'), { wrapper });

        expect(result.current.categoryValue).toEqual(DEFAULT_FILTERING_CONSTANTS.GENRES);
    });

    it('should update category value using setValue', () => {
        const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
        const { result } = renderHook(() => useCategoryFilter('GENRES'), { wrapper });

        act(() => {
            result.current.setValue(['Fantasy', 'Sci-Fi']);
        });

        expect(result.current.categoryValue).toEqual(['Fantasy', 'Sci-Fi']);
    });

    it('should toggle items using toggleItem', () => {
        const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
        const { result } = renderHook(() => useCategoryFilter('GENRES'), { wrapper });

        act(() => {
            result.current.setValue(['Fiction']);
        });

        act(() => {
            result.current.toggleItem('History');
        });

        expect(result.current.categoryValue).toEqual(['Fiction', 'History']);

        act(() => {
            result.current.toggleItem('Fiction');
        });

        expect(result.current.categoryValue).toEqual(['History']);
    });

    it('should handle numeric categories with toggleItem', () => {
        const wrapper = createWrapper(DEFAULT_FILTERING_CONSTANTS);
        const { result } = renderHook(() => useCategoryFilter('PAGES'), { wrapper });

        act(() => {
            result.current.setValue([100]);
        });

        act(() => {
            result.current.toggleItem(200);
        });

        expect(result.current.categoryValue).toEqual([100, 200]);

        act(() => {
            result.current.toggleItem(100);
        });

        expect(result.current.categoryValue).toEqual([200]);
    });
});
