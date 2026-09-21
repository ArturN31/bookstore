import { render, screen, fireEvent } from '@testing-library/react';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { usePrivacySettingsModal } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/usePrivacySettingsModal';
import { PrivacySettingsModal } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/PrivacySettingsModal';

jest.mock(
    '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/usePrivacySettingsModal',
    () => ({
        usePrivacySettingsModal: jest.fn(),
    }),
);

describe('PrivacySettingsModal', () => {
    const mockUsePrivacySettingsModal = usePrivacySettingsModal as jest.MockedFunction<
        typeof usePrivacySettingsModal
    >;

    const mockUserId = 'user-123';
    const mockInitialSettings: UserPrivacySettingsDto = {
        is_profile_public: true,
        is_wishlist_public: false,
        are_reviews_public: true,
        wishlist_share_token: 'token-123',
    };

    const defaultMockHookReturn = {
        settings: mockInitialSettings,
        isPending: false,
        errorMessage: null,
        copied: false,
        shareUrl: 'https://example.com/share?token=123',
        handleToggle: jest.fn(),
        handleRegenerateToken: jest.fn(),
        handleCopyTokenLink: jest.fn(),
    };

    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        userId: mockUserId,
        initialSettings: mockInitialSettings,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePrivacySettingsModal.mockReturnValue(defaultMockHookReturn);
    });

    it('returns null when isOpen is false', () => {
        const { container } = render(
            <PrivacySettingsModal
                {...defaultProps}
                isOpen={false}
            />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders modal dialog content when isOpen is true', () => {
        render(<PrivacySettingsModal {...defaultProps} />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Privacy Settings' })).toBeInTheDocument();
        expect(screen.getByText('Public Profile')).toBeInTheDocument();
        expect(screen.getByText('Public Wishlist')).toBeInTheDocument();
        expect(screen.getByText('Public Reviews')).toBeInTheDocument();
    });

    it('renders error message when errorMessage is present', () => {
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            errorMessage: 'Failed to update privacy settings',
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        expect(screen.getByText('Failed to update privacy settings')).toBeInTheDocument();
    });

    it('renders PrivateWishlistShareLink when is_wishlist_public is false', () => {
        render(<PrivacySettingsModal {...defaultProps} />);

        expect(screen.getByText('Private Wishlist Share Link')).toBeInTheDocument();
    });

    it('does not render PrivateWishlistShareLink when is_wishlist_public is true', () => {
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            settings: {
                ...mockInitialSettings,
                is_wishlist_public: true,
            },
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        expect(screen.queryByText('Private Wishlist Share Link')).not.toBeInTheDocument();
    });

    it('calls onClose when close icon or Done button is clicked', () => {
        render(<PrivacySettingsModal {...defaultProps} />);

        const closeIconButton = screen.getByRole('button', { name: 'Close modal' });
        fireEvent.click(closeIconButton);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

        const doneButton = screen.getByRole('button', { name: 'Done' });
        fireEvent.click(doneButton);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
    });

    it('calls handleToggle with is_profile_public when Public Profile toggle is clicked', () => {
        const mockHandleToggle = jest.fn();
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            handleToggle: mockHandleToggle,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const publicProfileToggle = screen.getByRole('switch', {
            name: 'Public Profile',
        });
        fireEvent.click(publicProfileToggle);

        expect(mockHandleToggle).toHaveBeenCalledWith('is_profile_public');
    });

    it('calls handleToggle with is_wishlist_public when Public Wishlist toggle is clicked', () => {
        const mockHandleToggle = jest.fn();
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            handleToggle: mockHandleToggle,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const publicWishlistToggle = screen.getByRole('switch', {
            name: 'Public Wishlist',
        });
        fireEvent.click(publicWishlistToggle);

        expect(mockHandleToggle).toHaveBeenCalledWith('is_wishlist_public');
    });

    it('calls handleToggle with are_reviews_public when Public Reviews toggle is clicked', () => {
        const mockHandleToggle = jest.fn();
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            handleToggle: mockHandleToggle,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const publicReviewsToggle = screen.getByRole('switch', {
            name: 'Public Reviews',
        });
        fireEvent.click(publicReviewsToggle);

        expect(mockHandleToggle).toHaveBeenCalledWith('are_reviews_public');
    });

    it('calls handleCopyTokenLink when copy button in PrivateWishlistShareLink is clicked', () => {
        const mockHandleCopyTokenLink = jest.fn();
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            handleCopyTokenLink: mockHandleCopyTokenLink,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const copyButton = screen.getByRole('button', { name: /copy/i });
        fireEvent.click(copyButton);

        expect(mockHandleCopyTokenLink).toHaveBeenCalledTimes(1);
    });

    it('calls handleRegenerateToken when regenerate button in PrivateWishlistShareLink is clicked', () => {
        const mockHandleRegenerateToken = jest.fn();
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            handleRegenerateToken: mockHandleRegenerateToken,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const regenerateButton = screen.getByRole('button', {
            name: /revoke & generate new link/i,
        });
        fireEvent.click(regenerateButton);

        expect(mockHandleRegenerateToken).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop and isPending is false', () => {
        render(<PrivacySettingsModal {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        fireEvent.click(dialog);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside the modal content container', () => {
        render(<PrivacySettingsModal {...defaultProps} />);

        const modalHeading = screen.getByRole('heading', { name: 'Privacy Settings' });
        fireEvent.click(modalHeading);

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when clicking backdrop while isPending is true', () => {
        mockUsePrivacySettingsModal.mockReturnValue({
            ...defaultMockHookReturn,
            isPending: true,
        });

        render(<PrivacySettingsModal {...defaultProps} />);

        const dialog = screen.getByRole('dialog');
        fireEvent.click(dialog);

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
});
