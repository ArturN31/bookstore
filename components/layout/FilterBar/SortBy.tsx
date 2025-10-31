'use client';

import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';
import { useBookFilter } from '@/providers/BookFilterProvider';

export const handleSortbyChoice = (
	filter: string,
	toggleFilter: (value: string) => void,
) => {
	const SortChoices = [
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

	if (SortChoices.includes(filter as (typeof SortChoices)[number])) {
		toggleFilter(filter as (typeof SortChoices)[number]);
	}
};

export const SortBy = () => {
	const { toggleFilter } = useBookFilter();

	const SortChoices = [
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

	return (
		<CustomPopoverWithList
			btnText='Sort By'
			btnIcon={undefined}
			listToRender={[...SortChoices]}
			listIcons={undefined}
			message={undefined}
			listItemOnClick={(filter: string) =>
				handleSortbyChoice(filter, toggleFilter as (value: string) => void)
			}
		/>
	);
};
