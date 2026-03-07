import { render, screen, fireEvent } from '@testing-library/react';
import { useBookFilter } from '@/providers/BookFilterProvider';
import { SortBy } from '@/components/layout/FilterBar/SortBy';

jest.mock('@/providers/BookFilterProvider', () => ({
    useBookFilter: jest.fn(),
}));

jest.mock('@/components/CustomPopoverWithList', () => ({
    CustomPopoverWithList: ({ btnText, listToRender, listItemOnClick }: any) => (
        <div>
            <button data-testid="popover-btn">{btnText}</button>
            <ul>
                {listToRender.map((choice: string) => (
                    <li
                        key={choice}
                        onClick={() => listItemOnClick(choice)}
                    >
                        {choice}
                    </li>
                ))}
            </ul>
        </div>
    ),
}));

describe('SortBy Component', () => {
    const mockToggleFilter = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display "Sort By" when no filterType is selected', () => {
        (useBookFilter as jest.Mock).mockReturnValue({
            filterType: '',
            toggleFilter: mockToggleFilter,
        });

        render(<SortBy />);

        const button = screen.getByTestId('popover-btn');
        expect(button).toHaveTextContent('Sort By');
    });

    it('should display the active filterType text when selected', () => {
        (useBookFilter as jest.Mock).mockReturnValue({
            filterType: 'Price: Low to High',
            toggleFilter: mockToggleFilter,
        });

        render(<SortBy />);

        const button = screen.getByTestId('popover-btn');
        expect(button).toHaveTextContent('Price: Low to High');
    });

    it('should call toggleFilter with the correct choice when an item is clicked', () => {
        (useBookFilter as jest.Mock).mockReturnValue({
            filterType: 'Title: A-Z',
            toggleFilter: mockToggleFilter,
        });

        render(<SortBy />);

        const choice = screen.getByText('Best Sellers');
        fireEvent.click(choice);

        expect(mockToggleFilter).toHaveBeenCalledWith('Best Sellers');
    });
});
