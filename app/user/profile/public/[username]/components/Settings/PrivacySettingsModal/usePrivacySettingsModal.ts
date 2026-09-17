'use client';

import {
    regenerateWishlistShareTokenAction,
    updatePrivacySettingsAction,
} from '@/data/user/profile/PrivacySettingsAction';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { useState, useTransition, useEffect, useCallback } from 'react';

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

    if (prevInitialSettings !== initialSettings) {
        setPrevInitialSettings(initialSettings);
        setSettings(initialSettings);
    }

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isPending) onClose();
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
            try {
                const result = await updatePrivacySettingsAction(userId, {
                    is_profile_public: updatedPayload.is_profile_public,
                    is_wishlist_public: updatedPayload.is_wishlist_public,
                    are_reviews_public: updatedPayload.are_reviews_public,
                });

                if (result.success)
                    setSettings((prev) => ({
                        ...prev,
                        [key]: newValue,
                        wishlist_share_token:
                            key === 'is_wishlist_public' && newValue
                                ? null
                                : prev.wishlist_share_token,
                    }));
                else setErrorMessage(sanitizeSupabaseError(result.error, userId));
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

                if (result.success && result.data?.token)
                    setSettings((prev) => ({
                        ...prev,
                        is_wishlist_public: false,
                        wishlist_share_token: result.data ? result.data.token : null,
                    }));
                else setErrorMessage(sanitizeSupabaseError(result.error, userId));
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
            setTimeout(() => setCopied(false), 2000);
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
