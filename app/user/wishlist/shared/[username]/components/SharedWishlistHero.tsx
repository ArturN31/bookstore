import Link from 'next/link';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';

interface SharedWishlistHeroProps {
    username: string;
    totalBooks: number;
    isPublicMode: boolean;
}

export function SharedWishlistHero({
    username,
    totalBooks,
    isPublicMode,
}: SharedWishlistHeroProps) {
    return (
        <section className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative z-10 flex items-start gap-4 sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 shadow-md">
                    <AccountCircleIcon sx={{ fontSize: 28 }} />
                </div>
                <div className="space-y-1">
                    <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                        {isPublicMode ? 'Curator Public Wishlist' : 'Curator Secure Share'}
                    </div>
                    <Typography
                        component="h1"
                        className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                    >
                        Reading List Showcase
                    </Typography>
                    <p className="max-w-xl font-sans text-sm leading-relaxed text-slate-600">
                        {isPublicMode ? (
                            <>
                                A public selection of titles handpicked by{' '}
                                <Link
                                    href={`/user/${username}`}
                                    className="font-semibold text-slate-900 hover:underline hover:underline-offset-4"
                                >
                                    @{username}
                                </Link>
                                .
                            </>
                        ) : (
                            <>
                                A private shared reading list curated via secure link by{' '}
                                <Link
                                    href={`/user/${username}`}
                                    className="font-semibold text-slate-900 hover:underline hover:underline-offset-4"
                                >
                                    @{username}
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 px-5 py-4 shadow-inner">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                    <CollectionsBookmarkIcon sx={{ fontSize: 22 }} />
                </div>
                <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        Total Saved
                    </div>
                    <div className="font-serif text-xl font-bold text-slate-900">
                        {totalBooks} {totalBooks === 1 ? 'Volume' : 'Volumes'}
                    </div>
                </div>
            </div>
        </section>
    );
}
