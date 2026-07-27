import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilteringSidebar } from '@/components/FilteringSidebar/FilteringSidebar';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    useBookFilter: jest.fn(),
}));

jest.mock('@/components/FilteringSidebar/FilteringSidebarSkeleton', () => ({
    FilteringSidebarSkeleton: () => <div data-testid="sidebar-skeleton" />,
}));

jest.mock('@/components/FilteringSidebar/Sections/FilteringSidebarButton', () => ({
    FilteringSidebarButton: ({ handleOpen }: { handleOpen: () => void }) => (
        <button
            data-testid="sidebar-button"
            onClick={handleOpen}
        >
            Open Filters
        </button>
    ),
}));

jest.mock('@/components/FilteringSidebar/Sections/FilteringSidebarHeader', () => ({
    FilteringSidebarHeader: ({ handleClose }: { handleClose: () => void }) => (
        <div data-testid="sidebar-header">
            <button
                data-testid="header-close-button"
                onClick={handleClose}
            >
                Close
            </button>
        </div>
    ),
}));

jest.mock('@/components/FilteringSidebar/Sections/FilteringSidebarResetButtonSection', () => ({
    FilteringSidebarResetButtonSection: () => <div data-testid="reset-button-section" />,
}));

jest.mock('@/components/FilteringSidebar/Sections/FilteringSidebarCategoriesContainer', () => ({
    FilteringSidebarCategoriesContainer: () => <div data-testid="categories-container" />,
}));

describe('FilteringSidebar', () => {
    const mockUseBookFilter = useBookFilter as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render skeleton when isLoading is true', () => {
        mockUseBookFilter.mockReturnValue({
            isLoading: true,
        });

        render(<FilteringSidebar />);

        expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument();
        expect(screen.queryByTestId('sidebar-button')).not.toBeInTheDocument();
    });

    it('should render sidebar button and open/close drawer when isLoading is false', async () => {
        mockUseBookFilter.mockReturnValue({
            isLoading: false,
        });

        render(<FilteringSidebar />);

        const openButton = screen.getByTestId('sidebar-button');
        expect(openButton).toBeInTheDocument();

        expect(screen.queryByTestId('sidebar-header')).not.toBeInTheDocument();

        fireEvent.click(openButton);
        expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
        expect(screen.getByTestId('reset-button-section')).toBeInTheDocument();
        expect(screen.getByTestId('categories-container')).toBeInTheDocument();

        const closeButton = screen.getByTestId('header-close-button');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByTestId('sidebar-header')).not.toBeInTheDocument();
        });
    });
});
