'use client';

import React from 'react';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { usePrivacySettingsModal } from './usePrivacySettingsModal';
import { PrivateWishlistShareLink } from './PrivateWishlistShareLink';
import { PrivacySettingsItem } from './PrivacySettingsItem';

export interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    initialSettings: UserPrivacySettingsDto;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
    isOpen,
    onClose,
    userId,
    initialSettings,
}) => {
    const {
        settings,
        isPending,
        errorMessage,
        copied,
        shareUrl,
        handleToggle,
        handleRegenerateToken,
        handleCopyTokenLink,
    } = usePrivacySettingsModal({
        isOpen,
        onClose,
        userId,
        initialSettings,
    });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-modal-title"
        >
            <div className="bg-gunmetal w-full max-w-lg rounded-2xl border border-slate-700/60 p-6 text-slate-100 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                    <h2
                        id="privacy-modal-title"
                        className="text-xl font-bold tracking-tight text-white"
                    >
                        Privacy Settings
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {errorMessage && (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-300">
                        {errorMessage}
                    </div>
                )}

                <div className="mt-6 space-y-6">
                    <PrivacySettingsItem
                        title="Public Profile"
                        description="Allow anyone to view your public profile page and account summary."
                        checked={settings.is_profile_public}
                        disabled={isPending}
                        onToggle={() => handleToggle('is_profile_public')}
                    />

                    <PrivacySettingsItem
                        title="Public Wishlist"
                        description="When enabled, anyone can search or visit your public wishlist page."
                        checked={settings.is_wishlist_public}
                        disabled={isPending}
                        onToggle={() => handleToggle('is_wishlist_public')}
                    />

                    {!settings.is_wishlist_public && (
                        <PrivateWishlistShareLink
                            shareUrl={shareUrl}
                            copied={copied}
                            disabled={isPending}
                            onCopy={handleCopyTokenLink}
                            onRegenerate={handleRegenerateToken}
                        />
                    )}

                    <PrivacySettingsItem
                        title="Public Reviews"
                        description="Allow others to view all product reviews submitted by your account."
                        checked={settings.are_reviews_public}
                        disabled={isPending}
                        onToggle={() => handleToggle('are_reviews_public')}
                    />
                </div>

                <div className="mt-8 flex justify-end border-t border-slate-700/60 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="cursor-pointer rounded-lg bg-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-600 hover:text-white disabled:opacity-50"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
