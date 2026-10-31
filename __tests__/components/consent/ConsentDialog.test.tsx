import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useConsent } from '@/providers/ConsentProvider';
import { ConsentDialog } from '@/components/consent/ConsentDialog';

jest.mock('@/providers/ConsentProvider', () => ({
    useConsent: jest.fn(),
}));

const mockUseConsent = useConsent as jest.MockedFunction<typeof useConsent>;

describe('ConsentDialog', () => {
    const defaultContext = {
        consent: null,
        isResolved: true,
        isSettingsOpen: true,
        openSettings: jest.fn(),
        rejectAnalytics: jest.fn(),
        acceptAll: jest.fn(),
        saveCustomConsent: jest.fn(),
        closeSettings: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders dialog content when isSettingsOpen is true', () => {
        mockUseConsent.mockReturnValue(defaultContext);

        render(<ConsentDialog />);

        expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
        expect(screen.getByText('Strictly Necessary Cookies')).toBeInTheDocument();
        expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    });

    test('does not show dialog content when isSettingsOpen is false', () => {
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            isSettingsOpen: false,
        });

        render(<ConsentDialog />);

        expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument();
    });

    test('calls closeSettings when Cancel button is clicked', () => {
        const closeSettings = jest.fn();
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            closeSettings,
        });

        render(<ConsentDialog />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(closeSettings).toHaveBeenCalledTimes(1);
    });

    test('toggles analytics switch and calls saveCustomConsent with updated state', () => {
        const saveCustomConsent = jest.fn();
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            saveCustomConsent,
        });

        render(<ConsentDialog />);

        const switches = screen.getAllByRole('switch');
        const analyticsSwitch = switches[1];

        expect(analyticsSwitch).toBeChecked();

        fireEvent.click(analyticsSwitch);
        expect(analyticsSwitch).not.toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));
        expect(saveCustomConsent).toHaveBeenCalledWith(false);
    });
});
