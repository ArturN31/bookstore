import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useConsent } from '@/providers/ConsentProvider';
import ConsentBanner from '@/components/consent/ConsentBanner';

jest.mock('@/providers/ConsentProvider', () => ({
    useConsent: jest.fn(),
}));

jest.mock('@/components/consent/ConsentDialog', () => ({
    ConsentDialog: () => (
        <div
            role="region"
            aria-label="Cookie Settings Dialog"
        >
            Dialog Mock
        </div>
    ),
}));

const mockUseConsent = useConsent as jest.MockedFunction<typeof useConsent>;

describe('ConsentBanner', () => {
    const defaultContext = {
        consent: null,
        isResolved: true,
        isSettingsOpen: false,
        openSettings: jest.fn(),
        rejectAnalytics: jest.fn(),
        acceptAll: jest.fn(),
        saveCustomConsent: jest.fn(),
        closeSettings: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders nothing when isResolved is false', () => {
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            isResolved: false,
        });

        const { container } = render(<ConsentBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing when consent is present and settings is closed', () => {
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            consent: { necessary: true, analytics: true, timestamp: '2026-01-01', version: '1.0' },
            isSettingsOpen: false,
        });

        const { container } = render(<ConsentBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders banner and dialog when consent is null and settings is closed', () => {
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            consent: null,
            isSettingsOpen: false,
        });

        render(<ConsentBanner />);

        expect(screen.getByText('We value your privacy')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /cookie settings dialog/i })).toBeInTheDocument();
    });

    test('renders dialog without banner when consent is present and settings is open', () => {
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            consent: { necessary: true, analytics: true, timestamp: '2026-01-01', version: '1.0' },
            isSettingsOpen: true,
        });

        render(<ConsentBanner />);

        expect(screen.queryByText('We value your privacy')).not.toBeInTheDocument();
        expect(screen.getByRole('region', { name: /cookie settings dialog/i })).toBeInTheDocument();
    });

    test('calls openSettings when Customize button is clicked', () => {
        const openSettings = jest.fn();
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            openSettings,
        });

        render(<ConsentBanner />);

        fireEvent.click(screen.getByRole('button', { name: /customize/i }));
        expect(openSettings).toHaveBeenCalledTimes(1);
    });

    test('calls rejectAnalytics when Reject All button is clicked', () => {
        const rejectAnalytics = jest.fn();
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            rejectAnalytics,
        });

        render(<ConsentBanner />);

        fireEvent.click(screen.getByRole('button', { name: /reject all/i }));
        expect(rejectAnalytics).toHaveBeenCalledTimes(1);
    });

    test('calls acceptAll when Accept All button is clicked', () => {
        const acceptAll = jest.fn();
        mockUseConsent.mockReturnValue({
            ...defaultContext,
            acceptAll,
        });

        render(<ConsentBanner />);

        const acceptButton = screen.getByRole('button', { name: /^accept all$/i });
        fireEvent.click(acceptButton);
        expect(acceptAll).toHaveBeenCalledTimes(1);
    });
});
