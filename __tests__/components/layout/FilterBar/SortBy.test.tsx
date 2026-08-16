import { render, screen, fireEvent } from '@testing-library/react';
import { useBookSortBy } from '@/providers/BookSortByProvider';
import { SortBy } from '@/components/layout/FilterBar/SortBy';

jest.mock('@/providers/BookSortByProvider', () => ({
    useBookSortBy: jest.fn(),
}));

jest.mock('@/components/ui/CustomPopoverWithList', () => ({
    CustomPopoverWithList: ({
        btnText,
        listToRender,
        listItemOnClick,
    }: {
        btnText: string;
        listToRender: string[];
        listItemOnClick: (choice: string) => void;
    }) => (
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
    const mockToggleSortByType = jest.fn();
    const mockedUseBookSortBy = useBookSortBy as unknown as jest.Mock<
        {
            sortByType: string;
            toggleSortByType: (type: string) => void;
        },
        []
    >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display "Sort By" when no filterType is selected', () => {
        mockedUseBookSortBy.mockReturnValue({
            sortByType: '',
            toggleSortByType: mockToggleSortByType,
        });

        render(<SortBy />);

        const button = screen.getByTestId('popover-btn');
        expect(button).toHaveTextContent('Sort By');
    });

    it('should display the active filterType text when selected', () => {
        mockedUseBookSortBy.mockReturnValue({
            sortByType: 'Price: Low to High',
            toggleSortByType: mockToggleSortByType,
        });

        render(<SortBy />);

        const button = screen.getByTestId('popover-btn');
        expect(button).toHaveTextContent('Price: Low to High');
    });

    it('should call toggleSortByType with the correct choice when an item is clicked', () => {
        mockedUseBookSortBy.mockReturnValue({
            sortByType: 'Title: A-Z',
            toggleSortByType: mockToggleSortByType,
        });

        render(<SortBy />);

        const choice = screen.getByText('Best Sellers');
        fireEvent.click(choice);

        expect(mockToggleSortByType).toHaveBeenCalledWith('Best Sellers');
    });
});
