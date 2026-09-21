// src/app/user/profile/public/[username]/components/PrivacySettingsControl.tsx
'use client';

import React, { useState } from 'react';
import { PrivacySettingsModal } from './PrivacySettingsModal/PrivacySettingsModal';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';

export interface PrivacySettingsControlProps {
    userId: string;
    initialSettings: UserPrivacySettingsDto;
}

export const PrivacySettingsControl: React.FC<PrivacySettingsControlProps> = ({
    userId,
    initialSettings,
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                <svg
                    className="h-4 w-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
                Privacy Settings
            </button>

            <PrivacySettingsModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                userId={userId}
                initialSettings={initialSettings}
            />
        </>
    );
};
