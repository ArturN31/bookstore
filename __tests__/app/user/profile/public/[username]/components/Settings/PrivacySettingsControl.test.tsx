import { render, screen, fireEvent } from '@testing-library/react';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { PrivacySettingsControl } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsControl';

interface MockPrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    initialSettings: UserPrivacySettingsDto;
}

jest.mock(
    '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/PrivacySettingsModal',
    () => ({
        PrivacySettingsModal: ({
            isOpen,
            onClose,
            userId,
            initialSettings,
        }: MockPrivacySettingsModalProps) => (
            <div data-testid="privacy-settings-modal">
                <span>Modal Open: {String(isOpen)}</span>
                <span>User ID: {userId}</span>
                <span>Profile Public: {String(initialSettings.is_profile_public)}</span>
                <button
                    type="button"
                    onClick={onClose}
                >
                    Close Modal
                </button>
            </div>
        ),
    }),
);

describe('PrivacySettingsControl', () => {
    const mockUserId = 'user-123';
    const mockSettings: UserPrivacySettingsDto = {
        is_profile_public: true,
        is_wishlist_public: false,
        are_reviews_public: true,
        wishlist_share_token: 'token-abc',
    };

    it('renders the control button initially and keeps modal closed', () => {
        render(
            <PrivacySettingsControl
                userId={mockUserId}
                initialSettings={mockSettings}
            />,
        );

        const button = screen.getByRole('button', { name: /privacy settings/i });
        expect(button).toBeInTheDocument();
        expect(screen.getByText('Modal Open: false')).toBeInTheDocument();
    });

    it('opens the modal when clicking the Privacy Settings button', () => {
        render(
            <PrivacySettingsControl
                userId={mockUserId}
                initialSettings={mockSettings}
            />,
        );

        const button = screen.getByRole('button', { name: /privacy settings/i });
        fireEvent.click(button);

        expect(screen.getByText('Modal Open: true')).toBeInTheDocument();
        expect(screen.getByText(`User ID: ${mockUserId}`)).toBeInTheDocument();
        expect(screen.getByText('Profile Public: true')).toBeInTheDocument();
    });

    it('closes the modal when onClose is triggered from within PrivacySettingsModal', () => {
        render(
            <PrivacySettingsControl
                userId={mockUserId}
                initialSettings={mockSettings}
            />,
        );

        const openButton = screen.getByRole('button', { name: /privacy settings/i });
        fireEvent.click(openButton);
        expect(screen.getByText('Modal Open: true')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close modal/i });
        fireEvent.click(closeButton);

        expect(screen.getByText('Modal Open: false')).toBeInTheDocument();
    });
});
