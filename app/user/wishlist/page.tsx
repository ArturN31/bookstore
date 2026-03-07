'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BooksManager } from '@/components/books/BooksManager';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { useUserState } from '@/providers/user/utils/useUser';
import { ErrorState } from '@/components/ErrorState';
import { ArrowForward, AutoStories, ContactPage, ShoppingBag } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

export default function UsersWishlist() {
    const { wishlist, profileExists, loading: userLoading } = useUserState();
    const [books, setBooks] = useState<Book[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fetchingBooks, setFetchingBooks] = useState(false);

    useEffect(() => {
        const loadWishlistBooks = async () => {
            if (!profileExists || !wishlist || wishlist.length === 0) {
                setBooks([]);
                return;
            }

            const bookIDs = Array.from(new Set(wishlist.map((item) => item.book_id)));

            try {
                setFetchingBooks(true);
                const response = await fetchBooksWithReviews({
                    bookIDs,
                    limit: bookIDs.length,
                });

                if (response.error) setError(response.error);
                else setBooks(response.data);
            } catch (err) {
                setError('Failed to fetch wishlist items.');
            } finally {
                setFetchingBooks(false);
            }
        };

        loadWishlistBooks();
    }, [wishlist, profileExists]);

    if (error) return <ErrorState message={error} />;

    if (userLoading) {
        return (
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
                <p className="mt-2 animate-pulse text-slate-500">
                    Loading your saved preferences...
                </p>
            </main>
        );
    }

    if (!profileExists) {
        return (
            <main className="container mx-auto max-w-7xl px-4 py-20">
                <div className="border-gunmetal/10 rounded-xl border-2 bg-white p-12 text-center shadow-sm">
                    <div className="text-gunmetal mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                        <ContactPage sx={{ fontSize: 40 }} />
                    </div>

                    <h2 className="text-gunmetal text-2xl font-bold tracking-tight">
                        Profile Setup Required
                    </h2>

                    <p className="mx-auto mt-3 max-w-sm leading-relaxed text-slate-500">
                        We need your address details to calculate shipping and sync your wishlist
                        properly.
                    </p>

                    <Link
                        href="/user/profile"
                        className="group bg-gunmetal mt-10 inline-flex items-center gap-2 rounded-md px-10 py-3.5 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
                    >
                        Go to Profile
                        <ArrowForward
                            className="transition-transform group-hover:translate-x-1"
                            sx={{ fontSize: 18 }}
                        />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-7xl space-y-10 px-4 py-12">
            <header className="relative border-b border-slate-100 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-gunmetal font-serif text-5xl tracking-tight">
                            Your Wishlist
                        </h1>
                        <div className="flex items-center gap-3">
                            {fetchingBooks ? (
                                <div className="flex items-center gap-2">
                                    <CircularProgress
                                        size={16}
                                        thickness={5}
                                        sx={{ color: '#2C3E50' }}
                                    />
                                    <p className="animate-pulse font-medium text-slate-400">
                                        Syncing library...
                                    </p>
                                </div>
                            ) : (
                                <p className="font-medium text-slate-500">
                                    {books.length} {books.length === 1 ? 'book' : 'books'} saved for
                                    later
                                </p>
                            )}
                        </div>
                    </div>

                    {books.length > 0 && (
                        <div className="hidden md:block">
                            <span className="text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">
                                Personal Collection
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {books.length > 0 ? (
                <section
                    aria-label="Wishlist collection"
                    className="transition-opacity duration-300"
                    style={{ opacity: fetchingBooks ? 0.7 : 1 }}
                >
                    <BooksManager
                        initialData={{
                            data: books,
                            total: books.length,
                            totalPages: 1,
                            currentPage: 1,
                            error: null,
                        }}
                    />
                </section>
            ) : (
                <section className="py-12">
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-16 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-200 shadow-sm">
                            <AutoStories sx={{ fontSize: 40 }} />
                        </div>

                        <h2 className="text-gunmetal text-2xl font-bold">Your wishlist is empty</h2>
                        <p className="mx-auto mt-3 max-w-sm text-slate-600">
                            Your wishlist is looking a bit lonely. Explore our collection and save
                            your favorites here.
                        </p>

                        <Link
                            href="/"
                            className="group bg-gunmetal mt-10 inline-flex items-center gap-3 rounded-md px-8 py-3.5 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
                        >
                            <ShoppingBag sx={{ fontSize: 20 }} />
                            Start Browsing
                        </Link>
                    </div>
                </section>
            )}
        </main>
    );
}
