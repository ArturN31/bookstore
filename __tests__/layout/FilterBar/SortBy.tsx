import { handleSortbyChoice, SortBy } from '../../../components/layout/FilterBar/SortBy';
import { useBookFilter } from '../../../providers/BookFilterProvider';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('../../../providers/BookFilterProvider');
const mockToggleFilter = jest.fn();

describe('FilterBar - SortBy', () => {
	beforeEach(() => {
		(useBookFilter as jest.Mock).mockReturnValue({
			filterType: 'Title: A-Z',
			toggleFilter: mockToggleFilter,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('Should render component', async () => {
		const { getByTestId } = render(await SortBy());

		const popoverBtn = getByTestId('popover-sort-by-btn');
		expect(popoverBtn);
	});

	it('should call toggleFilter with a valid sort choice', () => {
		const filter = 'Price: Low to High';
		handleSortbyChoice(filter, mockToggleFilter);
		expect(mockToggleFilter).toHaveBeenCalledWith(filter);
	});

	it('should not call toggleFilter with an invalid sort choice to cover the false branch', () => {
		const filter = 'Not a real choice';
		handleSortbyChoice(filter, mockToggleFilter);
		expect(mockToggleFilter).not.toHaveBeenCalled();
	});

	it('should call toggleFilter with the correct value when a list item is clicked', () => {
		render(<SortBy />);

		const sortButton = screen.getByTestId('popover-sort-by-btn');
		fireEvent.click(sortButton);

		const sortChoice = 'Price: Low to High';
		const listItemButton = screen.getByTestId(
			`popover-sort-by-choice-${sortChoice.toLocaleLowerCase().replaceAll(' ', '-')}`,
		);
		fireEvent.click(listItemButton);

		expect(mockToggleFilter).toHaveBeenCalledWith(sortChoice);
	});
});
