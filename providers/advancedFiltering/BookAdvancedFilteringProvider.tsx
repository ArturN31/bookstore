'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
    getFilteringConstants,
} from '@/data/advancedFiltering/FilteringConstants';

type BookAdvancedFilteringContextType = {
    advancedFilters: FilteringTypes;
    setAdvancedFilters: React.Dispatch<React.SetStateAction<FilteringTypes>>;
    isLoading: boolean;
    chosenFilters: FilteringTypes;
    setChosenFilters: React.Dispatch<React.SetStateAction<FilteringTypes>>;
};

const BookAdvancedFilteringContext = createContext<BookAdvancedFilteringContextType | null>(null);

interface BookAdvancedFilteringProviderProps {
    children: React.ReactNode;
    initialFilters?: FilteringTypes;
}

export const BookAdvancedFilteringProvider = ({
    children,
    initialFilters,
}: BookAdvancedFilteringProviderProps) => {
    const [advancedFilters, setAdvancedFilters] = useState<FilteringTypes>(
        initialFilters || DEFAULT_FILTERING_CONSTANTS,
    );
    const [isLoading, setIsLoading] = useState<boolean>(!initialFilters);
    const [chosenFilters, setChosenFilters] = useState<FilteringTypes>(DEFAULT_FILTERING_CONSTANTS);

    useEffect(() => {
        if (initialFilters) return;

        let isMounted = true;

        const fetchFilters = async () => {
            setIsLoading(true);
            const data = await getFilteringConstants();
            if (isMounted) {
                setAdvancedFilters(data);
                setIsLoading(false);
            }
        };

        fetchFilters();

        return () => {
            isMounted = false;
        };
    }, [initialFilters]);

    const contextValue = useMemo(
        () => ({
            advancedFilters,
            setAdvancedFilters,
            isLoading,
            chosenFilters,
            setChosenFilters,
        }),
        [advancedFilters, isLoading, chosenFilters],
    );

    return (
        <BookAdvancedFilteringContext.Provider value={contextValue}>
            {children}
        </BookAdvancedFilteringContext.Provider>
    );
};

export const useBookFilter = (): BookAdvancedFilteringContextType => {
    const context = useContext(BookAdvancedFilteringContext);
    if (!context) {
        throw new Error('useBookFilter must be used within a BookAdvancedFilteringProvider');
    }
    return context;
};
