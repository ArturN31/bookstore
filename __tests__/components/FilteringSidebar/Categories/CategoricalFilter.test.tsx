import { render, screen, fireEvent } from '@testing-library/react';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { CategoricalFilter } from '@/components/FilteringSidebar/Categories/CategoricalFilter';

jest.mock('@/data/advancedFiltering/useCategoryFilter', () => ({
    useCategoryFilter: jest.fn(),
}));

jest.mock('@/data/advancedFiltering/FilteringConstants', () => ({
    CATEGORY_LABELS: {
        GENRES: 'Genres',
        PAGES: 'Pages',
    },
}));

describe('CategoricalFilter', () => {
    const mockToggleItem = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: ['Fiction'],
            toggleItem: mockToggleItem,
        });
    });

    it('should render all sorted values and not show search input when values length <= 6', () => {
        render(
            <CategoricalFilter
                category="GENRES"
                values={['Sci-Fi', 'Action', 'Fiction']}
            />,
        );

        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Fiction')).toBeInTheDocument();
        expect(screen.getByText('Sci-Fi')).toBeInTheDocument();

        expect(screen.queryByPlaceholderText(/search genres/i)).not.toBeInTheDocument();
    });

    it('should show search input when values length > 6', () => {
        const manyValues = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'];
        render(
            <CategoricalFilter
                category="GENRES"
                values={manyValues}
            />,
        );

        expect(screen.getByPlaceholderText(/search genres/i)).toBeInTheDocument();
    });

    it('should filter values based on search query', () => {
        const values = ['Apple', 'Banana', 'Apricot', 'Cherry', 'Date', 'Elderberry', 'Fig'];
        render(
            <CategoricalFilter
                category="GENRES"
                values={values}
            />,
        );

        const searchInput = screen.getByPlaceholderText(/search genres/i);
        fireEvent.change(searchInput, { target: { value: 'ap' } });

        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Apricot')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });

    it('should show "No matching options" when search yields no results', () => {
        const values = ['Apple', 'Banana', 'Apricot', 'Cherry', 'Date', 'Elderberry', 'Fig'];
        render(
            <CategoricalFilter
                category="GENRES"
                values={values}
            />,
        );

        const searchInput = screen.getByPlaceholderText(/search genres/i);
        fireEvent.change(searchInput, { target: { value: 'xyz' } });

        expect(screen.getByText('No matching options')).toBeInTheDocument();
    });

    it('should call toggleItem when a checkbox is clicked', () => {
        render(
            <CategoricalFilter
                category="GENRES"
                values={['Fiction', 'Non-Fiction']}
            />,
        );

        const checkbox = screen.getByRole('checkbox', { name: /non-fiction/i });
        fireEvent.click(checkbox);

        expect(mockToggleItem).toHaveBeenCalledWith('Non-Fiction');
    });

    it('should render checkboxes as checked if they are in categoryValue', () => {
        render(
            <CategoricalFilter
                category="GENRES"
                values={['Fiction', 'Non-Fiction']}
            />,
        );

        const fictionCheckbox = screen.getByRole('checkbox', { name: /^fiction$/i });
        const nonFictionCheckbox = screen.getByRole('checkbox', { name: /non-fiction/i });

        expect(fictionCheckbox).toBeChecked();
        expect(nonFictionCheckbox).not.toBeChecked();
    });

    it('should handle non-array categoryValue and return empty activeSelectedValues', () => {
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: null,
            toggleItem: mockToggleItem,
        });

        render(
            <CategoricalFilter
                category="GENRES"
                values={['Fiction', 'Non-Fiction']}
            />,
        );

        const fictionCheckbox = screen.getByRole('checkbox', { name: /^fiction$/i });
        const nonFictionCheckbox = screen.getByRole('checkbox', { name: /non-fiction/i });

        expect(fictionCheckbox).not.toBeChecked();
        expect(nonFictionCheckbox).not.toBeChecked();
    });
});
