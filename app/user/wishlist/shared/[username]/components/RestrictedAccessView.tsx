import Link from 'next/link';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SharedWishlistHeader } from './SharedWishlistHeader';

interface RestrictedAccessViewProps {
    username: string;
    isPublicMode: boolean;
}

export function RestrictedAccessView({ username, isPublicMode }: RestrictedAccessViewProps) {
    return (
        <main className="min-h-screen bg-slate-50/60 px-4 py-8 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <SharedWishlistHeader />

                <section className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
                    <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl" />

                    <div className="relative z-10 flex items-start gap-4 sm:items-center">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-inner">
                            <LockIcon sx={{ fontSize: 28 }} />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold tracking-widest text-rose-600 uppercase">
                                Restricted Access
                            </div>
                            <Typography
                                component="h1"
                                className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                            >
                                Wishlist Unavailable
                            </Typography>
                            <p className="max-w-xl font-sans text-sm leading-relaxed text-slate-600">
                                {isPublicMode ? (
                                    <>
                                        The public collection belonging to{' '}
                                        <span className="font-semibold text-slate-900">
                                            @<Link href={`/user/${username}`}>{username}</Link>
                                        </span>{' '}
                                        cannot be accessed because it is currently set to private or
                                        does not exist in our catalog.
                                    </>
                                ) : (
                                    <>
                                        This private link for{' '}
                                        <span className="font-semibold text-slate-900">
                                            @<Link href={`/user/${username}`}>{username}</Link>
                                        </span>{' '}
                                        is invalid, has been revoked/reset, or does not exist in our
                                        catalog.
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
            </div>
        </main>
    );
}
