import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareLinkDisplay } from '@/app/user/wishlist/components/WishlistSharing/ShareLinkDisplay';

describe('ShareLinkDisplay', () => {
    const mockOnCopy = jest.fn();
    const mockOnReset = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render public layout correctly', () => {
        render(
            <ShareLinkDisplay
                isPublic={true}
                activeShareUrl="https://example.com/public"
                isPending={false}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        expect(screen.getByText('Public Share Link')).toBeInTheDocument();
        expect(screen.queryByText('Reset Token')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Share URL' })).toHaveValue(
            'https://example.com/public',
        );
    });

    it('should render private layout and reset button correctly', () => {
        render(
            <ShareLinkDisplay
                isPublic={false}
                activeShareUrl="https://example.com/private"
                isPending={false}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        expect(screen.getByText('Private Secure Link')).toBeInTheDocument();

        const resetButton = screen.getByRole('button', { name: /Reset Token/i });
        expect(resetButton).toBeInTheDocument();
        expect(resetButton).not.toBeDisabled();
    });

    it('should disable reset button when isPending is true', () => {
        render(
            <ShareLinkDisplay
                isPublic={false}
                activeShareUrl="https://example.com/private"
                isPending={true}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        const resetButton = screen.getByRole('button', { name: /Reset Token/i });
        expect(resetButton).toBeDisabled();
    });

    it('should call onReset when reset button is clicked', () => {
        render(
            <ShareLinkDisplay
                isPublic={false}
                activeShareUrl="https://example.com/private"
                isPending={false}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Reset Token/i }));
        expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should handle copy button state and click action', () => {
        render(
            <ShareLinkDisplay
                isPublic={true}
                activeShareUrl="https://example.com/copy"
                isPending={false}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        const copyButton = screen.getByRole('button', { name: /Copy/i });
        expect(copyButton).toBeInTheDocument();
        expect(copyButton).not.toBeDisabled();

        fireEvent.click(copyButton);
        expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it('should disable copy button when activeShareUrl is empty', () => {
        render(
            <ShareLinkDisplay
                isPublic={true}
                activeShareUrl=""
                isPending={false}
                copied={false}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        const copyButton = screen.getByRole('button', { name: /Copy/i });
        expect(copyButton).toBeDisabled();
    });

    it('should render "Copied" text when copied is true', () => {
        render(
            <ShareLinkDisplay
                isPublic={true}
                activeShareUrl="https://example.com/copy"
                isPending={false}
                copied={true}
                onCopy={mockOnCopy}
                onReset={mockOnReset}
            />,
        );

        expect(screen.getByRole('button', { name: /Copied/i })).toBeInTheDocument();
    });
});
