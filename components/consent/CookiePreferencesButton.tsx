'use client';

import React from 'react';
import { useConsent } from '@/providers/ConsentProvider';

export function CookiePreferencesButton(): React.JSX.Element {
    const { openSettings } = useConsent();

    return (
        <button
            type="button"
            onClick={openSettings}
            className="cursor-pointer border-none bg-transparent p-0 text-sky-500 transition-colors hover:text-sky-700"
            data-testid="footer-cookie-preferences-button"
        >
            Cookie Preferences
        </button>
    );
}
