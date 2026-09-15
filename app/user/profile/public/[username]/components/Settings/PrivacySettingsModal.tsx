'use client';

import {
    regenerateWishlistShareTokenAction,
    updatePrivacySettingsAction,
} from '@/data/user/profile/PrivacySettingsAction';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import React, { useState, useTransition, useEffect, useCallback } from 'react';

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
    const [isPending, startTransition] = useTransition();
    const [settings, setSettings] = useState<UserPrivacySettingsDto>(initialSettings);
    const [prevInitialSettings, setPrevInitialSettings] =
        useState<UserPrivacySettingsDto>(initialSettings);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    if (prevInitialSettings !== initialSettings) {
        setPrevInitialSettings(initialSettings);
        setSettings(initialSettings);
    }

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isPending) {
                onClose();
            }
        },
        [onClose, isPending],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const shareUrl = settings.wishlist_share_token
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/user/wishlist/shared?token=${settings.wishlist_share_token}`
        : '';

    const handleToggle = (key: keyof Omit<UserPrivacySettingsDto, 'wishlist_share_token'>) => {
        const newValue = !settings[key];
        const updatedPayload = {
            ...settings,
            [key]: newValue,
        };

        setErrorMessage(null);

        startTransition(async () => {
            const result = await updatePrivacySettingsAction(userId, {
                is_profile_public: updatedPayload.is_profile_public,
                is_wishlist_public: updatedPayload.is_wishlist_public,
                are_reviews_public: updatedPayload.are_reviews_public,
            });

            if (result.success) {
                setSettings((prev) => ({
                    ...prev,
                    [key]: newValue,
                    wishlist_share_token:
                        key === 'is_wishlist_public' && newValue ? null : prev.wishlist_share_token,
                }));
            } else {
                setErrorMessage(result.error ?? 'Failed to update privacy settings.');
            }
        });
    };

    const handleRegenerateToken = () => {
        setErrorMessage(null);

        startTransition(async () => {
            const result = await regenerateWishlistShareTokenAction(userId);

            if (result.success && result.data?.token) {
                setSettings((prev) => ({
                    ...prev,
                    is_wishlist_public: false,
                    wishlist_share_token: result.data ? result.data.token : null,
                }));
            } else {
                setErrorMessage(result.error ?? 'Failed to regenerate share link.');
            }
        });
    };

    const handleCopyTokenLink = async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setErrorMessage('Failed to copy link to clipboard.');
        }
    };

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
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-100">Public Profile</h3>
                            <p className="mt-0.5 text-sm text-slate-400">
                                Allow anyone to view your public profile page and account summary.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.is_profile_public}
                            disabled={isPending}
                            onClick={() => handleToggle('is_profile_public')}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                settings.is_profile_public ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.is_profile_public ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-100">Public Wishlist</h3>
                            <p className="mt-0.5 text-sm text-slate-400">
                                When enabled, anyone can search or visit your public wishlist page.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.is_wishlist_public}
                            disabled={isPending}
                            onClick={() => handleToggle('is_wishlist_public')}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                settings.is_wishlist_public ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.is_wishlist_public ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {!settings.is_wishlist_public && (
                        <div className="rounded-xl border border-slate-700/60 bg-[#121820] p-4">
                            <h4 className="text-sm font-semibold text-amber-400">
                                Private Wishlist Share Link
                            </h4>
                            <p className="mt-1 text-xs text-slate-400">
                                Share this private link to grant access to your wishlist without
                                making it public.
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="w-full rounded-lg border border-slate-700 bg-[#1c2430] px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyTokenLink}
                                    disabled={isPending || !shareUrl}
                                    className="cursor-pointer rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleRegenerateToken}
                                disabled={isPending}
                                className="mt-3 cursor-pointer text-xs font-medium text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                            >
                                Revoke & Generate New Link
                            </button>
                        </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-100">Public Reviews</h3>
                            <p className="mt-0.5 text-sm text-slate-400">
                                Allow others to view all product reviews submitted by your account.
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={settings.are_reviews_public}
                            disabled={isPending}
                            onClick={() => handleToggle('are_reviews_public')}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                settings.are_reviews_public ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    settings.are_reviews_public ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
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
