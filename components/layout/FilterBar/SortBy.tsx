'use client';

import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';
import { useBookFilter } from '@/providers/BookFilterProvider';

const SORT_CHOICES = [
    'Title: A-Z',
    'Title: Z-A',
    'Price: Low to High',
    'Price: High to Low',
    'Release Date: Newest to Oldest',
    'Release Date: Oldest to Newest',
    'Highest Avg. customer rating',
    'Lowest Avg. customer rating',
    'Best Sellers',
] as const;

type SortChoice = (typeof SORT_CHOICES)[number];

export const SortBy = () => {
    const { toggleFilter, filterType } = useBookFilter();

    return (
        <CustomPopoverWithList
            btnText={filterType || 'Sort By'}
            btnIcon={undefined}
            listToRender={[...SORT_CHOICES]}
            listIcons={undefined}
            message={undefined}
            listItemOnClick={(choice: string) => {
                toggleFilter(choice as SortChoice);
            }}
        />
    );
};
