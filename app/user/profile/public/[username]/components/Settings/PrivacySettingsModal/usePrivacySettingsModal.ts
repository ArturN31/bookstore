'use client';

import {
    regenerateWishlistShareTokenAction,
    updatePrivacySettingsAction,
} from '@/data/user/profile/PrivacySettingsAction';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { useState, useTransition, useEffect, useRef } from 'react';
import {
    buildWishlistShareUrl,
    getNextRegeneratedTokenSettings,
    getNextToggleSettings,
    PrivacyToggleKey,
} from './usePrivacySettingsModalUtils';

export interface UsePrivacySettingsModalOptions {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    initialSettings: UserPrivacySettingsDto;
}

export function usePrivacySettingsModal({
    isOpen,
    onClose,
    userId,
    initialSettings,
}: UsePrivacySettingsModalOptions) {
    const [isPending, startTransition] = useTransition();
    const [settings, setSettings] = useState<UserPrivacySettingsDto>(initialSettings);
    const [prevInitialSettings, setPrevInitialSettings] =
        useState<UserPrivacySettingsDto>(initialSettings);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

    if (prevInitialSettings !== initialSettings) {
        setPrevInitialSettings(initialSettings);
        setSettings(initialSettings);
    }

    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isPending) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, isPending, onClose]);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const shareUrl = buildWishlistShareUrl(settings.wishlist_share_token);

    const handleToggle = (key: PrivacyToggleKey) => {
        const { nextSettings, newValue } = getNextToggleSettings(settings, key);

        setErrorMessage(null);

        startTransition(async () => {
            try {
                const result = await updatePrivacySettingsAction(userId, {
                    is_profile_public: nextSettings.is_profile_public,
                    is_wishlist_public: nextSettings.is_wishlist_public,
                    are_reviews_public: nextSettings.are_reviews_public,
                });

                if (result.success) {
                    setSettings((prev) => getNextToggleSettings(prev, key).nextSettings);
                } else {
                    setErrorMessage(sanitizeSupabaseError(result.error, userId));
                }
            } catch (err: unknown) {
                setErrorMessage(sanitizeSupabaseError(err, userId));
            }
        });
    };

    const handleRegenerateToken = () => {
        setErrorMessage(null);

        startTransition(async () => {
            try {
                const result = await regenerateWishlistShareTokenAction(userId);

                if (result.success && result.data?.token) {
                    const newToken = result.data.token;
                    setSettings((prev) => getNextRegeneratedTokenSettings(prev, newToken));
                } else {
                    setErrorMessage(sanitizeSupabaseError(result.error, userId));
                }
            } catch (err: unknown) {
                setErrorMessage(sanitizeSupabaseError(err, userId));
            }
        });
    };

    const handleCopyTokenLink = async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);

            if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err: unknown) {
            setErrorMessage(sanitizeSupabaseError(err, userId));
        }
    };

    return {
        settings,
        isPending,
        errorMessage,
        copied,
        shareUrl,
        handleToggle,
        handleRegenerateToken,
        handleCopyTokenLink,
    };
}
