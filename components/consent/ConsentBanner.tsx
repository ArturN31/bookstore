'use client';

import React from 'react';
import { useConsent } from '@/providers/ConsentProvider';
import { ConsentDialog } from './ConsentDialog';

export function ConsentBanner(): React.JSX.Element | null {
    const { consent, isResolved, openSettings, rejectAnalytics, acceptAll, isSettingsOpen } =
        useConsent();

    if (!isResolved) return null;
    if (consent !== null && !isSettingsOpen) return null;

    return (
        <>
            {consent === null && !isSettingsOpen && (
                <div className="bg-gunmetal border-yellow fixed right-0 bottom-0 left-0 z-50 border-t-[3px] p-5 text-base text-white shadow-2xl">
                    <h1 className="mb-3 text-lg font-bold text-white">We value your privacy</h1>

                    <p className="mb-4 text-sm leading-snug text-slate-300">
                        We use strictly necessary cookies to operate our site. With your consent, we
                        also use analytics cookies to measure site performance and improve your
                        reading experience.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            type="button"
                            onClick={openSettings}
                            className="bg-yellow/80 hover:bg-yellow/60 cursor-pointer rounded border border-black px-5 py-2.5 text-sm text-black transition-colors"
                        >
                            Customize
                        </button>
                        <button
                            type="button"
                            onClick={rejectAnalytics}
                            className="bg-yellow/80 hover:bg-yellow/60 cursor-pointer rounded border border-black px-5 py-2.5 text-sm text-black transition-colors"
                        >
                            Reject All
                        </button>
                        <button
                            type="button"
                            onClick={acceptAll}
                            className="bg-yellow hover:bg-yellow/80 cursor-pointer rounded border border-black px-5 py-2.5 text-sm font-bold text-black transition-colors"
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            )}

            <ConsentDialog />
        </>
    );
}

export default ConsentBanner;
