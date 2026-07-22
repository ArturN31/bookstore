import { FilteringTypes } from '@/data/advancedFiltering/FilteringConstants';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { useCallback } from 'react';

export const useCategoryFilter = <K extends keyof FilteringTypes>(category: K) => {
    const { chosenFilters, setCategoryFilter, toggleFilterItem } = useBookFilter();

    const categoryValue = chosenFilters[category];

    const setValue = useCallback(
        (newValue: FilteringTypes[K]) => {
            setCategoryFilter(category, newValue);
        },
        [category, setCategoryFilter],
    );

    const toggleItem = useCallback(
        (itemValue: string | number) => {
            toggleFilterItem(category, itemValue);
        },
        [category, toggleFilterItem],
    );

    return {
        categoryValue,
        setValue,
        toggleItem,
    };
};
