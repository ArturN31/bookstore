import { PrivateWishlistShareLink } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/PrivateWishlistShareLink';
import { render, screen, fireEvent } from '@testing-library/react';

describe('PrivateWishlistShareLink', () => {
    const defaultProps = {
        shareUrl: 'https://example.com/wishlist/share?token=abc',
        copied: false,
        disabled: false,
        onCopy: jest.fn(),
        onRegenerate: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders heading, description, and read-only share URL input', () => {
        render(<PrivateWishlistShareLink {...defaultProps} />);

        expect(screen.getByText('Private Wishlist Share Link')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Share this private link to grant access to your wishlist without making it public.',
            ),
        ).toBeInTheDocument();

        const input = screen.getByRole('textbox');
        expect(input).toHaveValue(defaultProps.shareUrl);
        expect(input).toHaveAttribute('readOnly');
    });

    it('renders "Copy" button when copied is false and "Copied!" when copied is true', () => {
        const { rerender } = render(
            <PrivateWishlistShareLink
                {...defaultProps}
                copied={false}
            />,
        );
        expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();

        rerender(
            <PrivateWishlistShareLink
                {...defaultProps}
                copied={true}
            />,
        );
        expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    });

    it('calls onCopy when the Copy button is clicked', () => {
        render(<PrivateWishlistShareLink {...defaultProps} />);

        const copyButton = screen.getByRole('button', { name: 'Copy' });
        fireEvent.click(copyButton);

        expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
    });

    it('disables Copy button when shareUrl is empty', () => {
        render(
            <PrivateWishlistShareLink
                {...defaultProps}
                shareUrl=""
            />,
        );

        const copyButton = screen.getByRole('button', { name: 'Copy' });
        expect(copyButton).toBeDisabled();
    });

    it('calls onRegenerate when "Revoke & Generate New Link" button is clicked', () => {
        render(<PrivateWishlistShareLink {...defaultProps} />);

        const regenerateButton = screen.getByRole('button', {
            name: /revoke & generate new link/i,
        });
        fireEvent.click(regenerateButton);

        expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when disabled prop is true', () => {
        render(
            <PrivateWishlistShareLink
                {...defaultProps}
                disabled={true}
            />,
        );

        expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /revoke & generate new link/i })).toBeDisabled();
    });
});
