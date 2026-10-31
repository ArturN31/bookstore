import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
    CONSENT_VERSION,
    ConsentProvider,
    ConsentState,
    useConsent,
    CONSENT_COOKIE_NAME,
} from '@/providers/ConsentProvider';
import { saveUserConsentToSupabase } from '@/data/consentCookies/ConsentAction';

jest.mock('@/data/consentCookies/ConsentAction', () => ({
    saveUserConsentToSupabase: jest.fn().mockReturnValue(Promise.resolve()),
}));

const mockSaveUserConsentToSupabase = saveUserConsentToSupabase as jest.MockedFunction<
    typeof saveUserConsentToSupabase
>;

interface TestConsumerProps {
    onContextValue?: (value: ReturnType<typeof useConsent>) => void;
}

function TestConsumer({ onContextValue }: TestConsumerProps): React.JSX.Element {
    const context = useConsent();

    if (onContextValue) {
        onContextValue(context);
    }

    return (
        <div>
            <span data-testid="consent-status">
                {context.consent ? JSON.stringify(context.consent) : 'null'}
            </span>
            <span data-testid="is-resolved">{context.isResolved ? 'true' : 'false'}</span>
            <span data-testid="settings-open">{context.isSettingsOpen ? 'true' : 'false'}</span>
            <button
                data-testid="btn-accept"
                onClick={context.acceptAll}
            >
                Accept All
            </button>
            <button
                data-testid="btn-reject"
                onClick={context.rejectAnalytics}
            >
                Reject Analytics
            </button>
            <button
                data-testid="btn-custom"
                onClick={() => context.saveCustomConsent(true)}
            >
                Save Custom True
            </button>
            <button
                data-testid="btn-open-settings"
                onClick={context.openSettings}
            >
                Open Settings
            </button>
            <button
                data-testid="btn-close-settings"
                onClick={context.closeSettings}
            >
                Close Settings
            </button>
        </div>
    );
}

describe('ConsentProvider & useConsent', () => {
    const initialConsent: ConsentState = {
        necessary: true,
        analytics: false,
        timestamp: '2026-01-01T00:00:00.000Z',
        version: '1.0',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        document.cookie = '';
    });

    test('throws an error when useConsent is called outside of ConsentProvider', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<TestConsumer />)).toThrow(
            'useConsent must be used within a ConsentProvider',
        );

        consoleErrorSpy.mockRestore();
    });

    test('provides initial consent state and default settings states', () => {
        render(
            <ConsentProvider initialConsent={initialConsent}>
                <TestConsumer />
            </ConsentProvider>,
        );

        expect(screen.getByTestId('consent-status')).toHaveTextContent(
            JSON.stringify(initialConsent),
        );
        expect(screen.getByTestId('is-resolved')).toHaveTextContent('true');
        expect(screen.getByTestId('settings-open')).toHaveTextContent('false');
    });

    test('acceptAll updates state, writes cookie, calls Supabase, and closes settings', async () => {
        render(
            <ConsentProvider initialConsent={null}>
                <TestConsumer />
            </ConsentProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-accept').click();
        });

        expect(document.cookie).toContain(CONSENT_COOKIE_NAME);
        expect(mockSaveUserConsentToSupabase).toHaveBeenCalledWith(true, CONSENT_VERSION);
        expect(screen.getByTestId('settings-open')).toHaveTextContent('false');

        const parsedConsent = JSON.parse(screen.getByTestId('consent-status').textContent || '{}');
        expect(parsedConsent).toEqual({
            necessary: true,
            analytics: true,
            timestamp: expect.any(String),
            version: CONSENT_VERSION,
        });
    });

    test('rejectAnalytics updates state, writes cookie, calls Supabase, and closes settings', async () => {
        render(
            <ConsentProvider initialConsent={null}>
                <TestConsumer />
            </ConsentProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-reject').click();
        });

        expect(document.cookie).toContain(CONSENT_COOKIE_NAME);
        expect(mockSaveUserConsentToSupabase).toHaveBeenCalledWith(false, CONSENT_VERSION);
        expect(screen.getByTestId('settings-open')).toHaveTextContent('false');

        const parsedConsent = JSON.parse(screen.getByTestId('consent-status').textContent || '{}');
        expect(parsedConsent).toEqual({
            necessary: true,
            analytics: false,
            timestamp: expect.any(String),
            version: CONSENT_VERSION,
        });
    });

    test('saveCustomConsent updates state with custom choices', async () => {
        render(
            <ConsentProvider initialConsent={null}>
                <TestConsumer />
            </ConsentProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-custom').click();
        });

        expect(document.cookie).toContain(CONSENT_COOKIE_NAME);
        expect(mockSaveUserConsentToSupabase).toHaveBeenCalledWith(true, CONSENT_VERSION);

        const parsedConsent = JSON.parse(screen.getByTestId('consent-status').textContent || '{}');
        expect(parsedConsent).toEqual({
            necessary: true,
            analytics: true,
            timestamp: expect.any(String),
            version: CONSENT_VERSION,
        });
    });

    test('opens and closes settings correctly', () => {
        render(
            <ConsentProvider initialConsent={null}>
                <TestConsumer />
            </ConsentProvider>,
        );

        expect(screen.getByTestId('settings-open')).toHaveTextContent('false');

        act(() => {
            screen.getByTestId('btn-open-settings').click();
        });
        expect(screen.getByTestId('settings-open')).toHaveTextContent('true');

        act(() => {
            screen.getByTestId('btn-close-settings').click();
        });
        expect(screen.getByTestId('settings-open')).toHaveTextContent('false');
    });

    test('catches rejection silently when Supabase save fails', async () => {
        mockSaveUserConsentToSupabase.mockRejectedValueOnce(new Error('Network Error'));

        render(
            <ConsentProvider initialConsent={null}>
                <TestConsumer />
            </ConsentProvider>,
        );

        await expect(
            act(async () => {
                screen.getByTestId('btn-accept').click();
            }),
        ).resolves.not.toThrow();
    });
});
