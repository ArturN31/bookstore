import { render, screen, fireEvent } from '@testing-library/react';
import { FilteringSidebarCategoriesContainer } from '@/components/FilteringSidebar/Sections/FilteringSidebarCategoriesContainer';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    useBookFilter: jest.fn(),
}));

jest.mock('@/components/FilteringSidebar/Categories/DateRangeFilter', () => ({
    DateRangeFilter: () => <div data-testid="date-range-filter" />,
}));

jest.mock('@/components/FilteringSidebar/Categories/NumericRangeFilter', () => ({
    NumericRangeFilter: () => <div data-testid="numeric-range-filter" />,
}));

jest.mock('@/components/FilteringSidebar/Categories/CategoricalFilter', () => ({
    CategoricalFilter: () => <div data-testid="categorical-filter" />,
}));

describe('FilteringSidebarCategoriesContainer', () => {
    const mockUseBookFilter = useBookFilter as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render filter categories and omit empty ones', () => {
        mockUseBookFilter.mockReturnValue({
            advancedFilters: {
                AUTHORS: ['J.K. Rowling'],
                GENRES: [],
                PRICES: [10, 50],
                PUBLICATIONS: ['2020-01-01', '2023-01-01'],
            },
        });

        render(<FilteringSidebarCategoriesContainer />);

        expect(screen.getByText('Authors')).toBeInTheDocument();
        expect(screen.queryByText('Genres')).not.toBeInTheDocument();
        expect(screen.getByText('Price (£)')).toBeInTheDocument();
        expect(screen.getByText('Publication Date')).toBeInTheDocument();
        expect(screen.getByTestId('categorical-filter')).toBeInTheDocument();
        expect(screen.getByTestId('numeric-range-filter')).toBeInTheDocument();
        expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    });

    it('should handle accordion expansion and collapse toggle', () => {
        mockUseBookFilter.mockReturnValue({
            advancedFilters: {
                AUTHORS: ['J.K. Rowling'],
            },
        });

        render(<FilteringSidebarCategoriesContainer />);

        const accordionButton = screen.getByRole('button', { name: /authors/i });
        expect(accordionButton).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(accordionButton);
        expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should fall back to category key as label when CATEGORY_LABELS lacks the category', () => {
        mockUseBookFilter.mockReturnValue({
            advancedFilters: {
                UNKNOWN_CATEGORY: ['value1'],
            },
        });

        render(<FilteringSidebarCategoriesContainer />);

        expect(screen.getByText('UNKNOWN_CATEGORY')).toBeInTheDocument();
    });

    it('should fall back to true for isExpanded when panel state is missing', () => {
        mockUseBookFilter.mockReturnValue({
            advancedFilters: {
                UNKNOWN_CATEGORY: ['value1'],
            },
        });

        render(<FilteringSidebarCategoriesContainer />);

        const accordionButton = screen.getByRole('button', { name: /unknown_category/i });
        expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
    });
});
