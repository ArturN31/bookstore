import { CircularProgress } from '@mui/material';

interface WishlistHeaderProps {
    count: number;
    isSyncing: boolean;
}

export const WishlistHeader = ({ count, isSyncing }: WishlistHeaderProps) => (
    <header className="relative border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
                <h1 className="text-gunmetal font-serif text-5xl tracking-tight">Your Wishlist</h1>
                <div className="flex items-center gap-3">
                    {isSyncing ? (
                        <div className="flex items-center gap-2">
                            <CircularProgress
                                size={14}
                                thickness={6}
                                sx={{ color: '#2C3E50' }}
                            />
                            <p className="animate-pulse text-sm font-medium text-slate-400">
                                Syncing...
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-slate-500">
                            {count} {count === 1 ? 'book' : 'books'} saved
                        </p>
                    )}
                </div>
            </div>
            {count > 0 && (
                <div className="hidden md:block">
                    <span className="text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase">
                        Personal Collection
                    </span>
                </div>
            )}
        </div>
    </header>
);
