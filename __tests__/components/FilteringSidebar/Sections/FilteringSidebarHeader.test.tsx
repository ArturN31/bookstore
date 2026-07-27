import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilteringSidebarHeader } from '@/components/FilteringSidebar/Sections/FilteringSidebarHeader';

describe('FilteringSidebarHeader', () => {
    it('should render the title correctly', () => {
        const mockHandleClose = jest.fn();
        render(<FilteringSidebarHeader handleClose={mockHandleClose} />);

        const titleElement = screen.getByRole('heading', { name: /filters/i });
        expect(titleElement).toBeInTheDocument();
    });

    it('should render the close button with correct aria-label', () => {
        const mockHandleClose = jest.fn();
        render(<FilteringSidebarHeader handleClose={mockHandleClose} />);

        const closeButton = screen.getByRole('button', { name: /close filters sidebar/i });
        expect(closeButton).toBeInTheDocument();
    });

    it('should invoke handleClose when the close button is clicked', () => {
        const mockHandleClose = jest.fn();
        render(<FilteringSidebarHeader handleClose={mockHandleClose} />);

        const closeButton = screen.getByRole('button', { name: /close filters sidebar/i });
        fireEvent.click(closeButton);

        expect(mockHandleClose).toHaveBeenCalledTimes(1);
    });
});
