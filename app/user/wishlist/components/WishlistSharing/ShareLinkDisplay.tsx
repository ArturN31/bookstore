'use client';

import React from 'react';
import Typography from '@mui/material/Typography';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface ShareLinkDisplayProps {
    isPublic: boolean;
    activeShareUrl: string;
    isPending: boolean;
    copied: boolean;
    onCopy: () => void;
    onReset: () => void;
}

export const ShareLinkDisplay = ({
    isPublic,
    activeShareUrl,
    isPending,
    copied,
    onCopy,
    onReset,
}: ShareLinkDisplayProps) => {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <Typography
                    component="div"
                    className="text-xs font-extrabold tracking-wider text-slate-500 uppercase"
                >
                    {isPublic ? 'Public Share Link' : 'Private Secure Link'}
                </Typography>
                {!isPublic && (
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={isPending}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
                    >
                        <RefreshIcon sx={{ fontSize: 14 }} />
                        <span>Reset Token</span>
                    </button>
                )}
            </div>
            <div className="flex flex-col items-stretch gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-start">
                <textarea
                    readOnly
                    rows={2}
                    value={activeShareUrl}
                    aria-label="Share URL"
                    className="w-full resize-none bg-transparent p-1 font-mono text-xs break-all text-slate-700 outline-none select-all"
                />
                <button
                    type="button"
                    onClick={onCopy}
                    disabled={!activeShareUrl}
                    className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 self-end rounded-lg px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 sm:self-auto ${
                        copied
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800'
                    }`}
                >
                    {copied ? (
                        <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                        <LaunchIcon className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
        </div>
    );
};
