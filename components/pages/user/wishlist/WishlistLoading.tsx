import { CircularProgress } from '@mui/material';

export const WishlistLoading = () => (
    <main className="container mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32">
        <div className="relative flex items-center justify-center">
            <div className="bg-gunmetal/5 absolute h-16 w-16 animate-ping rounded-full" />
            <CircularProgress
                size={56}
                thickness={4}
                sx={{ color: '#20272f' }}
            />
        </div>
        <h2 className="text-gunmetal mt-8 text-xl font-bold tracking-tight">
            Curating your collection
        </h2>
        <p className="mt-2 animate-pulse text-slate-500">Loading your saved preferences...</p>
    </main>
);
