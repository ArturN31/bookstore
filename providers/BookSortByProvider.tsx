'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { BOOK_SORT_OPTIONS, BookSortType } from '@/data/books/BookConstants';

const FilterTypes = Object.values(BOOK_SORT_OPTIONS);

type BookSortByContextType = {
    sortByType: BookSortType;
    toggleSortByType: (choice: BookSortType) => void;
};

const BookSortByContext = createContext<BookSortByContextType>({
    sortByType: BOOK_SORT_OPTIONS.TITLE_ASC,
    toggleSortByType: () => {},
});

export const BookSortByProvider = ({ children }: { children: React.ReactNode }) => {
    const [sortByType, setSortBy] = useState<BookSortType>(BOOK_SORT_OPTIONS.TITLE_ASC);

    const contextValue = useMemo(
        () => ({
            sortByType,
            toggleSortByType: (choice: BookSortType) => {
                if (FilterTypes.includes(choice)) {
                    setSortBy(choice);
                }
            },
        }),
        [sortByType],
    );

    return <BookSortByContext.Provider value={contextValue}>{children}</BookSortByContext.Provider>;
};

export const useBookSortBy = () => useContext(BookSortByContext);
