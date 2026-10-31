import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useConsent } from '@/providers/ConsentProvider';
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton';

jest.mock('@/providers/ConsentProvider', () => ({
    useConsent: jest.fn(),
}));

const mockUseConsent = useConsent as jest.MockedFunction<typeof useConsent>;

describe('CookiePreferencesButton', () => {
    test('renders button and calls openSettings on click', () => {
        const openSettings = jest.fn();
        mockUseConsent.mockReturnValue({
            consent: null,
            isResolved: true,
            isSettingsOpen: false,
            openSettings,
            rejectAnalytics: jest.fn(),
            acceptAll: jest.fn(),
            saveCustomConsent: jest.fn(),
            closeSettings: jest.fn(),
        });

        render(<CookiePreferencesButton />);

        const button = screen.getByTestId('footer-cookie-preferences-button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Cookie Preferences');

        fireEvent.click(button);
        expect(openSettings).toHaveBeenCalledTimes(1);
    });
});
