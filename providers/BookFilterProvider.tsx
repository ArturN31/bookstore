'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { BOOK_SORT_OPTIONS, BookSortType } from '@/data/books/BookConstants';

const FilterTypes = Object.values(BOOK_SORT_OPTIONS);

type BookFilterContextType = {
    filterType: BookSortType;
    toggleFilter: (choice: BookSortType) => void;
};

const BookFilterContext = createContext<BookFilterContextType>({
    filterType: BOOK_SORT_OPTIONS.TITLE_ASC,
    toggleFilter: () => {},
});

export const BookFilterProvider = ({ children }: { children: React.ReactNode }) => {
    const [filterType, setFilter] = useState<BookSortType>(BOOK_SORT_OPTIONS.TITLE_ASC);

    const contextValue = useMemo(
        () => ({
            filterType,
            toggleFilter: (choice: BookSortType) => {
                if (FilterTypes.includes(choice)) {
                    setFilter(choice);
                }
            },
        }),
        [filterType],
    );

    return <BookFilterContext.Provider value={contextValue}>{children}</BookFilterContext.Provider>;
};

export const useBookFilter = () => useContext(BookFilterContext);
