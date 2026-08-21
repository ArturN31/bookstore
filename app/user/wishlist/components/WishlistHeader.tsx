'use client';

import { CircularProgress } from '@mui/material';
import { WishlistShareButton } from './WishlistSharing/WishlistShareButton';

interface WishlistHeaderProps {
    count: number;
    isSyncing: boolean;
}

export const WishlistHeader = ({ count, isSyncing }: WishlistHeaderProps) => {
    return (
        <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-extrabold tracking-[0.25em] text-slate-400 uppercase">
                        Library / Saved
                    </p>
                    <div className="flex items-baseline gap-3">
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Your Wishlist
                        </h1>
                        <span className="text-xs font-bold text-slate-500">
                            (
                            {isSyncing ? (
                                <CircularProgress
                                    size={10}
                                    thickness={6}
                                    sx={{ color: '#0F172A' }}
                                />
                            ) : (
                                count
                            )}
                            )
                        </span>
                    </div>
                </div>

                <div className="shrink-0">
                    <WishlistShareButton />
                </div>
            </div>
        </header>
    );
};
