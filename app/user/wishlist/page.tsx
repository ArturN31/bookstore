'use client';

import { useCallback, useEffect, useMemo, useState, startTransition } from 'react';
import { fetchBooksWithReviews } from '@/data/books/BookService';
import { useUserState } from '@/providers/user/utils/useUser';
import { ErrorState } from '@/components/ui/ErrorState';
import { BooksManager } from '@/components/books/BooksManager';
import { WishlistLoading } from '@/app/user/wishlist/components/WishlistLoading';
import { WishlistProfileRequired } from '@/app/user/wishlist/components/WishlistProfileRequired';
import { WishlistHeader } from '@/app/user/wishlist/components/WishlistHeader';
import { WishlistEmptyState } from '@/app/user/wishlist/components/WishlistEmptyState';

export default function UsersWishlist() {
    const { wishlist, profileExists, loading: userLoading } = useUserState();
    const [books, setBooks] = useState<Book[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fetchingBooks, setFetchingBooks] = useState(false);

    const bookIDs = useMemo(() => {
        if (!wishlist) return [];
        return Array.from(new Set(wishlist.map((item) => item.book_id)));
    }, [wishlist]);

    const loadWishlistBooks = useCallback(
        async (signal?: AbortSignal) => {
            if (!profileExists || bookIDs.length === 0) {
                startTransition(() => {
                    setBooks([]);
                    setFetchingBooks(false);
                });
                return;
            }

            try {
                startTransition(() => {
                    setFetchingBooks(true);
                    setError(null);
                });

                const response = await fetchBooksWithReviews({
                    bookIDs,
                    limit: bookIDs.length,
                });

                if (signal?.aborted) return;

                startTransition(() => {
                    if (response.error) setError(response.error);
                    else setBooks(response.data?.data ?? []);
                });
            } catch (err) {
                if (signal?.aborted) return;
                startTransition(() => {
                    setError('Failed to fetch wishlist items. Please try again.');
                });
            } finally {
                if (!signal?.aborted) {
                    startTransition(() => {
                        setFetchingBooks(false);
                    });
                }
            }
        },
        [bookIDs, profileExists],
    );

    useEffect(() => {
        const controller = new AbortController();

        loadWishlistBooks(controller.signal);

        return () => controller.abort();
    }, [loadWishlistBooks]);

    if (error) {
        return (
            <ErrorState
                title="Wishlist Unavailable"
                message={error}
                onRetry={() => loadWishlistBooks()}
            />
        );
    }

    if (userLoading) return <WishlistLoading />;
    if (!profileExists) return <WishlistProfileRequired />;

    return (
        <main className="container mx-auto max-w-7xl space-y-10 px-4 py-12">
            <WishlistHeader
                count={books.length}
                isSyncing={fetchingBooks}
            />

            {books.length > 0 ? (
                <section
                    className="transition-opacity duration-500"
                    style={{ opacity: fetchingBooks ? 0.6 : 1 }}
                >
                    <BooksManager
                        initialData={{
                            error: null,
                            data: {
                                data: books,
                                total: books.length,
                                totalPages: 1,
                                currentPage: 1,
                            },
                        }}
                    />
                </section>
            ) : (
                <WishlistEmptyState />
            )}
        </main>
    );
}
