'use client';

import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';
import { BOOK_SORT_OPTIONS, BookSortType } from '@/data/books/BookConstants';
import { useBookSortBy } from '@/providers/BookSortByProvider';

export const SortBy = () => {
    const { toggleSortByType, sortByType } = useBookSortBy();

    const sortOptionsList = Object.values(BOOK_SORT_OPTIONS);

    return (
        <CustomPopoverWithList
            btnText={sortByType || 'Sort By'}
            btnIcon={undefined}
            listToRender={sortOptionsList}
            listIcons={undefined}
            message={undefined}
            listItemOnClick={(choice: string) => {
                toggleSortByType(choice as BookSortType);
            }}
        />
    );
};
