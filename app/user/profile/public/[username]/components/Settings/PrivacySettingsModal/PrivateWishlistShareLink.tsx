import React from 'react';

export interface PrivateWishlistShareLinkProps {
    shareUrl: string;
    copied: boolean;
    disabled?: boolean;
    onCopy: () => void;
    onRegenerate: () => void;
}

export const PrivateWishlistShareLink: React.FC<PrivateWishlistShareLinkProps> = ({
    shareUrl,
    copied,
    disabled = false,
    onCopy,
    onRegenerate,
}) => {
    return (
        <div className="rounded-xl border border-slate-700/60 bg-[#121820] p-4">
            <h4 className="text-sm font-semibold text-amber-400">Private Wishlist Share Link</h4>
            <p className="mt-1 text-xs text-slate-400">
                Share this private link to grant access to your wishlist without making it public.
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
                    onClick={onCopy}
                    disabled={disabled || !shareUrl}
                    className="cursor-pointer rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            <button
                type="button"
                onClick={onRegenerate}
                disabled={disabled}
                className="mt-3 cursor-pointer text-xs font-medium text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
            >
                Revoke & Generate New Link
            </button>
        </div>
    );
};
