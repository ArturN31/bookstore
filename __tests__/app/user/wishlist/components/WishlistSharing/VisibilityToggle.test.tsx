import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisibilityToggle } from '@/app/user/wishlist/components/WishlistSharing/VisibilityToggle';

describe('VisibilityToggle', () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render public state correctly', () => {
        render(
            <VisibilityToggle
                isPublic={true}
                isPending={false}
                onToggle={mockOnToggle}
            />,
        );

        expect(screen.getByText('Public Wishlist')).toBeInTheDocument();
        expect(
            screen.getByText('Anyone can view your wishlist via your username profile link.'),
        ).toBeInTheDocument();
        const switchInput = screen.getByRole('switch', {
            name: /Toggle public or private wishlist visibility/i,
        });
        expect(switchInput).toBeChecked();
        expect(switchInput).not.toBeDisabled();
    });

    it('should render private state correctly and handle toggle', () => {
        render(
            <VisibilityToggle
                isPublic={false}
                isPending={false}
                onToggle={mockOnToggle}
            />,
        );

        expect(screen.getByText('Private Wishlist')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Hidden from public searches. Only accessible via secure private token link.',
            ),
        ).toBeInTheDocument();
        const switchInput = screen.getByRole('switch', {
            name: /Toggle public or private wishlist visibility/i,
        });
        expect(switchInput).not.toBeChecked();

        fireEvent.click(switchInput);
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when pending', () => {
        render(
            <VisibilityToggle
                isPublic={false}
                isPending={true}
                onToggle={mockOnToggle}
            />,
        );

        const switchInput = screen.getByRole('switch', {
            name: /Toggle public or private wishlist visibility/i,
        });
        expect(switchInput).toBeDisabled();
    });
});
