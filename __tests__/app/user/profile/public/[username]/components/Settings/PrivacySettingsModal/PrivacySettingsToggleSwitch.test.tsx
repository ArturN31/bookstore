import { PrivacySettingsToggleSwitch } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/PrivacySettingsToggleSwitch';
import { render, screen, fireEvent } from '@testing-library/react';

describe('PrivacySettingsToggleSwitch', () => {
    const defaultProps = {
        checked: false,
        disabled: false,
        onChange: jest.fn(),
        ariaLabel: 'Toggle feature',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with role switch and correct accessibility attributes', () => {
        render(
            <PrivacySettingsToggleSwitch
                {...defaultProps}
                checked={true}
            />,
        );

        const toggle = screen.getByRole('switch', { name: 'Toggle feature' });
        expect(toggle).toBeInTheDocument();
        expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('triggers onChange when clicked', () => {
        render(<PrivacySettingsToggleSwitch {...defaultProps} />);

        const toggle = screen.getByRole('switch', { name: 'Toggle feature' });
        fireEvent.click(toggle);

        expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
    });

    it('is disabled and prevents clicks when disabled prop is true', () => {
        render(
            <PrivacySettingsToggleSwitch
                {...defaultProps}
                disabled={true}
            />,
        );

        const toggle = screen.getByRole('switch', { name: 'Toggle feature' });
        expect(toggle).toBeDisabled();

        fireEvent.click(toggle);
        expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it('applies checked styling classes appropriately', () => {
        const { rerender } = render(
            <PrivacySettingsToggleSwitch
                {...defaultProps}
                checked={false}
            />,
        );

        let toggle = screen.getByRole('switch');
        expect(toggle).toHaveClass('bg-slate-700');

        rerender(
            <PrivacySettingsToggleSwitch
                {...defaultProps}
                checked={true}
            />,
        );
        toggle = screen.getByRole('switch');
        expect(toggle).toHaveClass('bg-amber-500');
    });
});
