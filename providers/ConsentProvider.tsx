'use client';

import { saveUserConsentToSupabase } from '@/data/consentCookies/ConsentAction';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConsentContextType {
    consent: ConsentState | null;
    isResolved: boolean;
    acceptAll: () => void;
    rejectAnalytics: () => void;
    saveCustomConsent: (analytics: boolean) => void;
    openSettings: () => void;
    isSettingsOpen: boolean;
    closeSettings: () => void;
}
export interface ConsentState {
    necessary: boolean;
    analytics: boolean;
    timestamp: string;
    version: string;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

interface ConsentProviderProps {
    children: ReactNode;
    initialConsent: ConsentState | null;
}

export const CONSENT_COOKIE_NAME = 'sb_consent_prefs';
export const CONSENT_VERSION = '1.0';

export function setConsentCookie(state: { analytics: boolean }): void {
    const fullState: ConsentState = {
        necessary: true,
        analytics: state.analytics,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
    };
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(fullState))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function ConsentProvider({
    children,
    initialConsent,
}: ConsentProviderProps): React.JSX.Element {
    const [consent, setConsent] = useState<ConsentState | null>(initialConsent);
    const [isResolved] = useState<boolean>(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

    const acceptAll = (): void => {
        setConsentCookie({ analytics: true });
        setConsent({
            necessary: true,
            analytics: true,
            timestamp: new Date().toISOString(),
            version: CONSENT_VERSION,
        });
        saveUserConsentToSupabase(true, CONSENT_VERSION).catch(() => {});
        setIsSettingsOpen(false);
    };

    const rejectAnalytics = (): void => {
        setConsentCookie({ analytics: false });
        setConsent({
            necessary: true,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: CONSENT_VERSION,
        });
        saveUserConsentToSupabase(false, CONSENT_VERSION).catch(() => {});
        setIsSettingsOpen(false);
    };

    const saveCustomConsent = (analytics: boolean): void => {
        setConsentCookie({ analytics });
        setConsent({
            necessary: true,
            analytics,
            timestamp: new Date().toISOString(),
            version: CONSENT_VERSION,
        });
        saveUserConsentToSupabase(analytics, CONSENT_VERSION).catch(() => {});
        setIsSettingsOpen(false);
    };

    const openSettings = (): void => setIsSettingsOpen(true);
    const closeSettings = (): void => setIsSettingsOpen(false);

    return (
        <ConsentContext.Provider
            value={{
                consent,
                isResolved,
                acceptAll,
                rejectAnalytics,
                saveCustomConsent,
                openSettings,
                isSettingsOpen,
                closeSettings,
            }}
        >
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent(): ConsentContextType {
    const context = useContext(ConsentContext);
    if (!context) throw new Error('useConsent must be used within a ConsentProvider');
    return context;
}
