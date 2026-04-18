'use client';

import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';
import { BOOK_SORT_OPTIONS, BookSortType } from '@/data/books/BookConstants';
import { useBookFilter } from '@/providers/BookFilterProvider';

export const SortBy = () => {
    const { toggleFilter, filterType } = useBookFilter();

    const sortOptionsList = Object.values(BOOK_SORT_OPTIONS);

    return (
        <CustomPopoverWithList
            btnText={filterType || 'Sort By'}
            btnIcon={undefined}
            listToRender={sortOptionsList}
            listIcons={undefined}
            message={undefined}
            listItemOnClick={(choice: string) => {
                toggleFilter(choice as BookSortType);
            }}
        />
    );
};
