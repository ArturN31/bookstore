'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useBookFilter } from '@/providers/BookFilterProvider';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { BookCard } from '@/components/books/bookCard/BookCard';
import { PaginatedBookResult } from '@/data/books/BookConstants';
import { FetchBooksFilters } from '@/data/books/BookRepository';

interface BooksManagerProps {
    initialData: ActionResponse<PaginatedBookResult>;
    filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
}

export const BooksManager = ({ initialData, filters }: BooksManagerProps) => {
    const { filterType } = useBookFilter();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [books, setBooks] = useState<Book[]>(initialData.data?.data ?? []);
    const [page, setPage] = useState(initialData.data?.currentPage ?? 1);
    const [totalPages, setTotalPages] = useState(initialData.data?.totalPages ?? 1);
    const [hasMore, setHasMore] = useState(
        (initialData.data?.currentPage ?? 1) < (initialData.data?.totalPages ?? 1),
    );
    const [isLoading, setIsLoading] = useState(false);

    const { ref: observerRef, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    const fetchBooks = useCallback(
        async (isNextPage: boolean) => {
            if (abortControllerRef.current) abortControllerRef.current.abort();

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const targetPage = isNextPage ? page + 1 : 1;
            setIsLoading(true);

            try {
                const response = await fetchBooksWithReviews({
                    ...filters,
                    sortBy: filterType,
                    page: targetPage,
                    limit: 18,
                });

                if (controller.signal.aborted) return;

                if (!response.error && response.data) {
                    const {
                        data: newBooks,
                        totalPages: updatedTotalPages,
                        currentPage,
                    } = response.data;
                    setBooks((prev) => (isNextPage ? [...prev, ...newBooks] : newBooks));
                    setPage(currentPage);
                    setTotalPages(updatedTotalPages);
                    setHasMore(currentPage < updatedTotalPages);
                    if (!isNextPage) window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                if (!(err instanceof DOMException && err.name === 'AbortError'))
                    console.error('Failed to fetch books:', err);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        },
        [filterType, filters, page],
    );

    useEffect(() => {
        const isDefault = filterType === 'Title: A-Z' && page === 1;
        if (!isDefault) fetchBooks(false);
        return () => abortControllerRef.current?.abort();
    }, [filterType, filters]);

    useEffect(() => {
        if (inView && hasMore && !isLoading) fetchBooks(true);
    }, [inView, hasMore, isLoading, fetchBooks]);

    return (
        <div className="mx-auto w-full max-w-screen-2xl">
            <div className="flex flex-col gap-8">
                <section
                    className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    aria-label="Books gallery"
                >
                    {books.map((book) => (
                        <div
                            key={`${book.id}-${filterType}`}
                            className="flex justify-center transition-opacity duration-300"
                            style={{ opacity: isLoading && page === 1 ? 0.5 : 1 }}
                        >
                            <BookCard book={book} />
                        </div>
                    ))}
                </section>

                <footer
                    ref={observerRef}
                    className="flex min-h-32 flex-col items-center justify-center py-12"
                >
                    {isLoading && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Loading more
                            </p>
                        </div>
                    )}
                    {!hasMore && books.length > 0 && (
                        <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                            You've reached the end
                        </p>
                    )}
                </footer>
            </div>
        </div>
    );
};
