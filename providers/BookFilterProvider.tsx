import { createContext, useContext, useMemo, useState } from 'react';

const FilterTypes = [
	'Title: A-Z',
	'Title: Z-A',
	'Price: Low to High',
	'Price: High to Low',
	'Release Date: Newest to Oldest',
	'Release Date: Oldest to Newest',
	'Avg. customer review',
	'Best Sellers',
] as const;

type BookFilterContextType = {
	filterType: (typeof FilterTypes)[number];
	toggleFilter: (choice: (typeof FilterTypes)[number]) => void;
};

const BookFilterContext = createContext<BookFilterContextType>({
	filterType: 'Best Sellers',
	toggleFilter: () => {},
});

export const BookFilterProvider = ({ children }: { children: React.ReactNode }) => {
	const [filterType, setFilter] = useState<(typeof FilterTypes)[number]>('Best Sellers');

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
