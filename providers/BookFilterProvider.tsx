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

/**
 * Manages and provides the current book filtering option to the application.
 *
 * This provider offers a centralized state for the user's selected book filter
 * (e.g., 'Price: Low to High', 'Title: A-Z'). It allows any component within
 * its scope to read the current filter type and change it.
 *
 * The provider makes the following data and functions available via the BookFilterContext:
 * - `filterType`: The currently active filter option as a string.
 * - `toggleFilter`: A function to update the current filter type.
 *
 * This provider should be used to wrap any component or page that needs to
 * access or change the book filtering settings, ensuring that the filter state
 * is consistent across the application.
 *
 * You can access the provided values using the `useBookFilter` custom hook.
 */
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

	return (
		<BookFilterContext.Provider value={contextValue}>
			{children}
		</BookFilterContext.Provider>
	);
};

export const useBookFilter = () => useContext(BookFilterContext);
