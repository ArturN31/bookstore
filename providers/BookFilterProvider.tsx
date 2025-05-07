import { createContext, useContext, useMemo, useState } from 'react';

const FilterTypes = [
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

type BookFilterContextType = {
	filterType: (typeof FilterTypes)[number];
	toggleFilter: (choice: (typeof FilterTypes)[number]) => void;
};

const BookFilterContext = createContext<BookFilterContextType>({
	filterType: 'Title: A-Z',
	toggleFilter: () => {},
});

export const BookFilterProvider = ({ children }: { children: React.ReactNode }) => {
	const [filterType, setFilter] = useState<(typeof FilterTypes)[number]>('Title: A-Z');

	const contextValue = useMemo(
		() => ({
			filterType,
			toggleFilter: (choice: (typeof FilterTypes)[number]) => {
				setFilter(choice);
			},
		}),
		[filterType],
	);

	return <BookFilterContext.Provider value={contextValue}>{children}</BookFilterContext.Provider>;
};

export const useBookFilter = () => useContext(BookFilterContext);
