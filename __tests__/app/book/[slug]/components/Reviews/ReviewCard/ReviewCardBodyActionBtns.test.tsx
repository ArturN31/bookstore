import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewCardBodyActionBtns } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCardBodyActionBtns';

describe('ReviewCardBodyActionBtns', () => {
    const mockId = 'review-123';
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing if neither onEdit nor onDelete is provided', () => {
        const { container } = render(<ReviewCardBodyActionBtns id={mockId} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render only edit button when onEdit is provided', () => {
        render(
            <ReviewCardBodyActionBtns
                id={mockId}
                onEdit={mockOnEdit}
            />,
        );

        const editButton = screen.getByRole('button', { name: /edit review/i });
        expect(editButton).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete review/i })).not.toBeInTheDocument();

        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
        expect(mockOnEdit).toHaveBeenCalledWith(mockId);
    });

    it('should render only delete button when onDelete is provided', () => {
        render(
            <ReviewCardBodyActionBtns
                id={mockId}
                onDelete={mockOnDelete}
            />,
        );

        const deleteButton = screen.getByRole('button', { name: /delete review/i });
        expect(deleteButton).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit review/i })).not.toBeInTheDocument();

        fireEvent.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith(mockId);
    });

    it('should render both buttons when both onEdit and onDelete are provided', () => {
        render(
            <ReviewCardBodyActionBtns
                id={mockId}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />,
        );

        const editButton = screen.getByRole('button', { name: /edit review/i });
        const deleteButton = screen.getByRole('button', { name: /delete review/i });

        expect(editButton).toBeInTheDocument();
        expect(deleteButton).toBeInTheDocument();

        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledWith(mockId);

        fireEvent.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledWith(mockId);
    });
});
