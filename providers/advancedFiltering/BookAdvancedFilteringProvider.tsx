'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    startTransition,
} from 'react';
import {
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
    getFilteringConstants,
} from '@/data/advancedFiltering/FilteringConstants';

export type BookAdvancedFilteringContextType = {
    advancedFilters: FilteringTypes;
    setAdvancedFilters: React.Dispatch<React.SetStateAction<FilteringTypes>>;
    isLoading: boolean;
    chosenFilters: FilteringTypes;
    setChosenFilters: React.Dispatch<React.SetStateAction<FilteringTypes>>;
    setCategoryFilter: <K extends keyof FilteringTypes>(
        category: K,
        value: FilteringTypes[K],
    ) => void;
    toggleFilterItem: <K extends keyof FilteringTypes>(
        category: K,
        itemValue: string | number,
    ) => void;
    resetAllFilters: () => void;
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
        () => initialFilters || { ...DEFAULT_FILTERING_CONSTANTS },
    );
    const [isLoading, setIsLoading] = useState<boolean>(() => !initialFilters);
    const [chosenFilters, setChosenFilters] = useState<FilteringTypes>(() => ({
        ...DEFAULT_FILTERING_CONSTANTS,
    }));

    useEffect(() => {
        if (initialFilters) return;

        let isMounted = true;

        const fetchFilters = async () => {
            try {
                const data = await getFilteringConstants();
                if (isMounted) {
                    startTransition(() => {
                        setAdvancedFilters(data);
                        setIsLoading(false);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch filtering constants:', error);
                if (isMounted) {
                    startTransition(() => {
                        setIsLoading(false);
                    });
                }
            }
        };

        fetchFilters();

        return () => {
            isMounted = false;
        };
    }, [initialFilters]);

    const setCategoryFilter = useCallback(
        <K extends keyof FilteringTypes>(category: K, value: FilteringTypes[K]) => {
            setChosenFilters((prev) => ({
                ...prev,
                [category]: value,
            }));
        },
        [],
    );

    const toggleFilterItem = useCallback(
        <K extends keyof FilteringTypes>(category: K, itemValue: string | number) => {
            setChosenFilters((prev) => {
                const rawValue = prev[category];
                const currentArray = Array.isArray(rawValue)
                    ? (rawValue as (string | number)[])
                    : [];
                const stringifiedValues = currentArray.map(String);
                const itemStr = String(itemValue);

                const updated = stringifiedValues.includes(itemStr)
                    ? currentArray.filter((val) => String(val) !== itemStr)
                    : [...currentArray, itemValue];

                return {
                    ...prev,
                    [category]: updated as FilteringTypes[K],
                };
            });
        },
        [],
    );

    const resetAllFilters = useCallback(() => {
        setChosenFilters({ ...DEFAULT_FILTERING_CONSTANTS });
    }, []);

    const contextValue = useMemo(
        () => ({
            advancedFilters,
            setAdvancedFilters,
            isLoading,
            chosenFilters,
            setChosenFilters,
            setCategoryFilter,
            toggleFilterItem,
            resetAllFilters,
        }),
        [
            advancedFilters,
            isLoading,
            chosenFilters,
            setCategoryFilter,
            toggleFilterItem,
            resetAllFilters,
        ],
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
