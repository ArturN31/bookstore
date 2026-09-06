import Link from 'next/link';
import Typography from '@mui/material/Typography';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface EmptyWishlistViewProps {
    username: string;
    isPublicMode: boolean;
}

export function EmptyWishlistView({ username, isPublicMode }: EmptyWishlistViewProps) {
    return (
        <section className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

            <div className="relative z-10 flex items-start gap-4 sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 shadow-inner">
                    <CollectionsBookmarkIcon sx={{ fontSize: 28 }} />
                </div>
                <div className="space-y-1">
                    <div className="text-xs font-bold tracking-widest text-amber-600 uppercase">
                        {isPublicMode ? 'Public Wishlist' : 'Shared Collection'}
                    </div>
                    <Typography
                        component="h1"
                        className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                    >
                        Wishlist is Empty
                    </Typography>
                    <p className="max-w-xl font-sans text-sm leading-relaxed text-slate-600">
                        {isPublicMode ? (
                            <>
                                The public reading list belonging to{' '}
                                <span className="font-semibold text-slate-900">
                                    @<Link href={`/user/${username}`}>{username}</Link>
                                </span>{' '}
                                does not contain any books yet.
                            </>
                        ) : (
                            <>
                                This private shared collection belonging to{' '}
                                <span className="font-semibold text-slate-900">
                                    @<Link href={`/user/${username}`}>{username}</Link>
                                </span>{' '}
                                does not have any books added at this time.
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 px-5 py-4 shadow-inner">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-colors hover:bg-slate-800"
                >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    <span>Return to Store</span>
                </Link>
            </div>
        </section>
    );
}
