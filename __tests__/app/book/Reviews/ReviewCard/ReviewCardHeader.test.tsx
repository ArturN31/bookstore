import { SelectedReview } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCard';
import { ReviewCardHeader } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCardHeader';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ReviewCardHeader', () => {
    const mockReview: SelectedReview = {
        id: 'review-1',
        username: 'johndoe',
        rating: 5,
        review: 'Great book!',
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
    };

    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render username and created date correctly', () => {
        render(<ReviewCardHeader review={mockReview} />);

        expect(screen.getByText(/— johndoe/i)).toBeInTheDocument();
        const expectedDate = new Date(mockReview.created_at).toLocaleDateString();
        expect(screen.getByText(new RegExp(`Posted ${expectedDate}`, 'i'))).toBeInTheDocument();
        expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
    });

    it('should display edited label when updated_at differs from created_at', () => {
        const updatedReview: SelectedReview = {
            ...mockReview,
            updated_at: '2026-01-02T12:00:00.000Z',
        };

        render(<ReviewCardHeader review={updatedReview} />);

        const expectedCreatedDate = new Date(updatedReview.created_at).toLocaleDateString();
        const expectedUpdatedDate = new Date(updatedReview.updated_at).toLocaleDateString();

        expect(
            screen.getByText(new RegExp(`Posted ${expectedCreatedDate}`, 'i')),
        ).toBeInTheDocument();
        expect(
            screen.getByText(new RegExp(`• Edited ${expectedUpdatedDate}`, 'i')),
        ).toBeInTheDocument();
    });

    it('should handle invalid or empty dates gracefully', () => {
        const invalidDateReview: SelectedReview = {
            ...mockReview,
            created_at: '',
            updated_at: '',
        };

        render(<ReviewCardHeader review={invalidDateReview} />);

        expect(screen.getByText(/— johndoe/i)).toBeInTheDocument();
        expect(screen.getByText(/^posted\s*$/i)).toBeInTheDocument();
    });

    it('should trigger onEdit and onDelete handlers when action buttons are clicked', () => {
        render(
            <ReviewCardHeader
                review={mockReview}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />,
        );

        const editButton = screen.getByRole('button', { name: /edit review/i });
        const deleteButton = screen.getByRole('button', { name: /delete review/i });

        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledTimes(1);
        expect(mockOnEdit).toHaveBeenCalledWith(mockReview.id);

        fireEvent.click(deleteButton);
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith(mockReview.id);
    });
});
