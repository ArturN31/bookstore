import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';
import { FilteringSidebarResetButtonSection } from '@/components/FilteringSidebar/Sections/FilteringSidebarResetButtonSection';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    useBookFilter: jest.fn(),
}));

describe('FilteringSidebarResetButtonSection', () => {
    const mockResetAllFilters = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useBookFilter as jest.Mock).mockReturnValue({
            resetAllFilters: mockResetAllFilters,
        });
    });

    it('should render the reset button correctly', () => {
        render(<FilteringSidebarResetButtonSection />);

        const resetButton = screen.getByRole('button', { name: /reset all filters/i });
        expect(resetButton).toBeInTheDocument();
    });

    it('should invoke resetAllFilters when clicked', () => {
        render(<FilteringSidebarResetButtonSection />);

        const resetButton = screen.getByRole('button', { name: /reset all filters/i });
        fireEvent.click(resetButton);

        expect(mockResetAllFilters).toHaveBeenCalledTimes(1);
    });
});
