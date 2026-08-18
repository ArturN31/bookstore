'use client';

import { useState, useTransition } from 'react';
import { enqueueSnackbar } from 'notistack';
import { useUserState } from '@/providers/user/utils/useUser';
import { updateWishlistVisibilityAction } from '@/data/user/wishlist/sharing/WishlistShareAction';

export interface UserRecord {
    id?: string;
    username?: string;
    is_wishlist_public?: boolean;
    wishlist_share_token?: string | null;
}

export const useWishlistSharing = () => {
    const { user } = useUserState();
    const userRecord = user as UserRecord | null;

    const username = userRecord?.username ?? '';
    const userId = userRecord?.id ?? '';
    const serverIsPublic = userRecord?.is_wishlist_public ?? false;
    const serverToken = userRecord?.wishlist_share_token ?? '';

    const [open, setOpen] = useState<boolean>(false);
    const [localIsPublic, setLocalIsPublic] = useState<boolean | null>(null);
    const [localToken, setLocalToken] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isPending, startTransition] = useTransition();

    const isPublic = localIsPublic ?? serverIsPublic;
    const shareToken = localToken ?? serverToken;

    const handleTogglePublic = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newPublicState = event.target.checked;
        setLocalIsPublic(newPublicState);

        const updatedToken = newPublicState ? null : shareToken || crypto.randomUUID();
        setLocalToken(updatedToken);

        startTransition(async () => {
            try {
                if (!userId) throw new Error('User identifier missing');

                const result = await updateWishlistVisibilityAction(
                    userId,
                    newPublicState,
                    updatedToken ?? undefined,
                );
                if (result.error) throw new Error(result.error);

                enqueueSnackbar(
                    newPublicState ? 'Wishlist is now public' : 'Wishlist is now private',
                    {
                        variant: 'success',
                    },
                );
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to update visibility';
                enqueueSnackbar(errorMessage, { variant: 'error' });
                setLocalIsPublic(null);
                setLocalToken(null);
            }
        });
    };

    const handleGenerateOrResetToken = () => {
        const newToken = crypto.randomUUID();
        setLocalToken(newToken);

        startTransition(async () => {
            try {
                if (!userId) throw new Error('User identifier missing');
                const result = await updateWishlistVisibilityAction(userId, isPublic, newToken);
                if (result.error) throw new Error(result.error);
                enqueueSnackbar('Private share link updated successfully', { variant: 'success' });
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to generate token';
                enqueueSnackbar(errorMessage, { variant: 'error' });
                setLocalToken(null);
            }
        });
    };

    const activeShareUrl = isPublic
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/user/wishlist/shared/${encodeURIComponent(
              username,
          )}`
        : shareToken
          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/user/wishlist/shared/token/${encodeURIComponent(
                shareToken,
            )}`
          : '';

    const handleCopyShareLink = async (): Promise<void> => {
        if (!activeShareUrl) return;
        try {
            await navigator.clipboard.writeText(activeShareUrl);
            setCopied(true);
            enqueueSnackbar('Link copied to clipboard!', { variant: 'success' });
            setTimeout(() => setCopied(false), 2500);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to copy link';
            console.error('[useWishlistSharing] Clipboard failure:', errorMessage);
            enqueueSnackbar('Failed to copy link.', { variant: 'error' });
        }
    };

    return {
        username,
        open,
        setOpen,
        isPublic,
        shareToken,
        isPending,
        copied,
        activeShareUrl,
        handleTogglePublic,
        handleGenerateOrResetToken,
        handleCopyShareLink,
    };
};
