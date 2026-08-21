import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WishlistShareButton } from '@/app/user/wishlist/components/WishlistSharing/WishlistShareButton';
import { useWishlistSharing } from '@/app/user/wishlist/components/WishlistSharing/hook/useWishlistSharing';

jest.mock('@/app/user/wishlist/components/WishlistSharing/hook/useWishlistSharing');

jest.mock('@/app/user/wishlist/components/WishlistSharing/VisibilityToggle', () => ({
    VisibilityToggle: () => <div data-testid="visibility-toggle" />,
}));

jest.mock('@/app/user/wishlist/components/WishlistSharing/ShareLinkDisplay', () => ({
    ShareLinkDisplay: () => <div data-testid="share-link-display" />,
}));

jest.mock('@/app/user/wishlist/components/WishlistSharing/EmptyShareState', () => ({
    EmptyShareState: () => <div data-testid="empty-share-state" />,
}));

describe('WishlistShareButton', () => {
    const mockUseWishlistSharing = useWishlistSharing as jest.MockedFunction<
        typeof useWishlistSharing
    >;

    const defaultMockState = {
        username: 'testuser',
        open: false,
        setOpen: jest.fn(),
        isPublic: false,
        shareToken: 'token-123',
        isPending: false,
        copied: false,
        activeShareUrl: 'https://example.com/share',
        handleTogglePublic: jest.fn(),
        handleGenerateOrResetToken: jest.fn(),
        handleCopyShareLink: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return null if username is not present', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            username: '',
        } as unknown as ReturnType<typeof useWishlistSharing>);

        const { container } = render(<WishlistShareButton />);
        expect(container.firstChild).toBeNull();
    });

    it('should render the share trigger button and open dialog on click', () => {
        mockUseWishlistSharing.mockReturnValue(
            defaultMockState as unknown as ReturnType<typeof useWishlistSharing>,
        );

        render(<WishlistShareButton />);

        const triggerButton = screen.getByRole('button', { name: /Share Options/i });
        expect(triggerButton).toBeInTheDocument();

        fireEvent.click(triggerButton);
        expect(defaultMockState.setOpen).toHaveBeenCalledWith(true);
    });

    it('should render Dialog contents when open is true', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            open: true,
        } as unknown as ReturnType<typeof useWishlistSharing>);

        render(<WishlistShareButton />);

        expect(screen.getByText('Wishlist Sharing Settings')).toBeInTheDocument();
        expect(screen.getByTestId('visibility-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('share-link-display')).toBeInTheDocument();
        expect(screen.queryByTestId('empty-share-state')).not.toBeInTheDocument();
    });

    it('should render EmptyShareState when not public and no shareToken exists', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            open: true,
            isPublic: false,
            shareToken: null,
        } as unknown as ReturnType<typeof useWishlistSharing>);

        render(<WishlistShareButton />);

        expect(screen.getByTestId('visibility-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('empty-share-state')).toBeInTheDocument();
        expect(screen.queryByTestId('share-link-display')).not.toBeInTheDocument();
    });

    it('should render ShareLinkDisplay when public even if no shareToken exists', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            open: true,
            isPublic: true,
            shareToken: null,
        } as unknown as ReturnType<typeof useWishlistSharing>);

        render(<WishlistShareButton />);

        expect(screen.getByTestId('visibility-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('share-link-display')).toBeInTheDocument();
        expect(screen.queryByTestId('empty-share-state')).not.toBeInTheDocument();
    });

    it('should call setOpen(false) when the close button is clicked', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            open: true,
        } as unknown as ReturnType<typeof useWishlistSharing>);

        render(<WishlistShareButton />);

        const closeButton = screen.getByRole('button', { name: /Close/i });
        fireEvent.click(closeButton);

        expect(defaultMockState.setOpen).toHaveBeenCalledWith(false);
    });

    it('should call setOpen(false) when Dialog onClose is triggered via Escape key', () => {
        mockUseWishlistSharing.mockReturnValue({
            ...defaultMockState,
            open: true,
        } as unknown as ReturnType<typeof useWishlistSharing>);

        render(<WishlistShareButton />);

        const dialog = screen.getByRole('dialog');
        fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape', charCode: 27 });

        expect(defaultMockState.setOpen).toHaveBeenCalledWith(false);
    });
});
