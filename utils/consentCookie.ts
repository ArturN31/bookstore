export interface ConsentState {
    necessary: boolean;
    analytics: boolean;
    timestamp: string;
    version: string;
}

export const CONSENT_COOKIE_NAME = 'sb_consent_prefs';
export const CONSENT_VERSION = '1.0';

export function setConsentCookie(state: { analytics: boolean }): void {
    if (typeof document === 'undefined') return;
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
