'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useBookFilter } from '@/providers/BookFilterProvider';
import {
    fetchBooksWithReviews,
    FetchBooksResponse,
    FetchBooksFilters,
} from '@/data/books/GetBooksData';
import { BookCard } from '@/components/books/bookCard/BookCard';

interface BooksManagerProps {
    initialData: FetchBooksResponse;
    filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
}

export const BooksManager = ({ initialData, filters }: BooksManagerProps) => {
    const { filterType } = useBookFilter();

    const [books, setBooks] = useState<Book[]>(initialData.data);
    const [page, setPage] = useState(initialData.currentPage);
    const [hasMore, setHasMore] = useState(initialData.currentPage < initialData.totalPages);
    const [isLoading, setIsLoading] = useState(false);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    useEffect(() => {
        const resetForSort = async () => {
            setIsLoading(true);
            const response = await fetchBooksWithReviews({
                ...filters,
                sortBy: filterType,
                page: 1,
                limit: 12,
            });

            if (!response.error) {
                setBooks(response.data);
                setPage(1);
                setHasMore(1 < response.totalPages);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            setIsLoading(false);
        };

        if (filterType !== 'Title: A-Z' || page !== 1) resetForSort();
    }, [filterType, filters]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const nextPage = page + 1;

        const response = await fetchBooksWithReviews({
            ...filters,
            page: nextPage,
            limit: 12,
        });

        if (!response.error) {
            setBooks((prev) => [...prev, ...response.data]);
            setPage(nextPage);
            setHasMore(nextPage < response.totalPages);
        }
        setIsLoading(false);
    }, [page, hasMore, isLoading, filters]);

    useEffect(() => {
        if (inView) loadMore();
    }, [inView, loadMore]);

    useEffect(() => {
        setBooks(initialData.data);
        setPage(initialData.currentPage);
        setHasMore(initialData.currentPage < initialData.totalPages);
    }, [initialData]);

    if (books.length === 0 && !isLoading) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 italic">No books found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12">
            <section
                className="m-auto grid w-full grid-cols-1 gap-10 space-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                aria-label="Books gallery"
            >
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="flex justify-center"
                    >
                        <BookCard book={book} />
                    </div>
                ))}
            </section>

            <div
                ref={ref}
                className="flex h-20 items-center justify-center"
            >
                {isLoading && (
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                )}
                {!hasMore && books.length > 0 && (
                    <p className="text-sm text-gray-400">End of collection.</p>
                )}
            </div>
        </div>
    );
};
