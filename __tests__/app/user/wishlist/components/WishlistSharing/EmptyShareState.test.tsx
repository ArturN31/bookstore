import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyShareState } from '@/app/user/wishlist/components/WishlistSharing/EmptyShareState';

describe('EmptyShareState', () => {
    const mockOnGenerate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the descriptive text and generate button', () => {
        render(
            <EmptyShareState
                isPending={false}
                onGenerate={mockOnGenerate}
            />,
        );

        expect(
            screen.getByText(/You do not have an active private share link generated yet/i),
        ).toBeInTheDocument();

        const button = screen.getByRole('button', { name: /Generate Private Share Link/i });
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
    });

    it('should call onGenerate when the button is clicked', () => {
        render(
            <EmptyShareState
                isPending={false}
                onGenerate={mockOnGenerate}
            />,
        );

        const button = screen.getByRole('button', { name: /Generate Private Share Link/i });
        fireEvent.click(button);

        expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });

    it('should disable the button when isPending is true', () => {
        render(
            <EmptyShareState
                isPending={true}
                onGenerate={mockOnGenerate}
            />,
        );

        const button = screen.getByRole('button', { name: /Generate Private Share Link/i });
        expect(button).toBeDisabled();
    });
});
