'use client';

import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckIcon from '@mui/icons-material/Check';

interface WishlistShareButtonProps {
    username: string;
}

export const WishlistShareButton = ({ username }: WishlistShareButtonProps) => {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopyShareLink = async (): Promise<void> => {
        const shareUrl = `${window.location.origin}/user/wishlist/shared/${encodeURIComponent(username)}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            enqueueSnackbar('Link copied to clipboard!', { variant: 'success' });
            setTimeout(() => setCopied(false), 2500);
        } catch (err: unknown) {
            console.error('[WishlistShareButton] Clipboard failure:', err);
            enqueueSnackbar('Failed to copy link.', { variant: 'error' });
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopyShareLink}
            className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 sm:w-auto ${
                copied
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'hover:bg-gunmetal text-gunmetal border-slate-300 bg-transparent hover:border-slate-900 hover:text-white'
            }`}
        >
            {copied ? (
                <CheckIcon className="h-3.5 w-3.5" />
            ) : (
                <LaunchIcon className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Share Link'}</span>
        </button>
    );
};
