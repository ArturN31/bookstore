import { PrivacySettingsItem } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/PrivacySettingsItem';
import { render, screen, fireEvent } from '@testing-library/react';

describe('PrivacySettingsItem', () => {
    const defaultProps = {
        title: 'Public Profile',
        description: 'Allow anyone to view your profile.',
        checked: true,
        disabled: false,
        onToggle: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders title and description correctly', () => {
        render(<PrivacySettingsItem {...defaultProps} />);

        expect(screen.getByText('Public Profile')).toBeInTheDocument();
        expect(screen.getByText('Allow anyone to view your profile.')).toBeInTheDocument();
    });

    it('renders toggle switch with correct aria-checked attribute', () => {
        render(
            <PrivacySettingsItem
                {...defaultProps}
                checked={false}
            />,
        );

        const toggle = screen.getByRole('switch', { name: 'Public Profile' });
        expect(toggle).toBeInTheDocument();
        expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('calls onToggle when the toggle switch is clicked', () => {
        render(<PrivacySettingsItem {...defaultProps} />);

        const toggle = screen.getByRole('switch', { name: 'Public Profile' });
        fireEvent.click(toggle);

        expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    });

    it('disables the toggle switch when disabled prop is true', () => {
        render(
            <PrivacySettingsItem
                {...defaultProps}
                disabled={true}
            />,
        );

        const toggle = screen.getByRole('switch', { name: 'Public Profile' });
        expect(toggle).toBeDisabled();
    });
});
