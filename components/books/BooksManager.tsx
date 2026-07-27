'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useBookSortBy } from '@/providers/BookSortByProvider';
import { BookCard } from '@/components/books/bookCard/BookCard';
import { PaginatedBookResult } from '@/data/books/BookConstants';
import { BookQueryParams } from '@/data/books/BookRepository';
import { useBooksFetcher } from '@/data/books/useBooksFetcher';
import { useBookFilter } from '@/providers/advancedFiltering/BookAdvancedFilteringProvider';

interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

interface BooksManagerProps {
    initialData: ActionResponse<PaginatedBookResult>;
    queryParams?: Omit<BookQueryParams, 'page' | 'limit'>;
}

export const BooksManager = ({ initialData, queryParams }: BooksManagerProps) => {
    const { sortByType } = useBookSortBy();
    const { chosenFilters } = useBookFilter();

    const [debouncedFilters, setDebouncedFilters] = useState(chosenFilters);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(chosenFilters);
        }, 1000);

        return () => clearTimeout(timer);
    }, [chosenFilters]);

    const mergedParams = useMemo<Omit<BookQueryParams, 'page' | 'limit'>>(() => {
        return {
            ...queryParams,
            authors: debouncedFilters.AUTHORS.length > 0 ? debouncedFilters.AUTHORS : undefined,
            formats: debouncedFilters.FORMATS.length > 0 ? debouncedFilters.FORMATS : undefined,
            genres: debouncedFilters.GENRES.length > 0 ? debouncedFilters.GENRES : undefined,
            publishers:
                debouncedFilters.PUBLISHERS.length > 0 ? debouncedFilters.PUBLISHERS : undefined,
            pages:
                debouncedFilters.PAGES.length > 0 ? debouncedFilters.PAGES.map(String) : undefined,
            prices:
                debouncedFilters.PRICES.length > 0
                    ? debouncedFilters.PRICES.map(String)
                    : undefined,
            publications:
                debouncedFilters.PUBLICATIONS.length > 0
                    ? debouncedFilters.PUBLICATIONS
                    : undefined,
        };
    }, [queryParams, debouncedFilters]);

    const { state, isLoading, fetchBooks } = useBooksFetcher({
        initialData,
        queryParams: mergedParams,
        sortByType,
    });

    const { ref: observerRef } = useInView({
        threshold: 0,
        rootMargin: '400px',
        onChange: (inView: boolean) => {
            if (inView && state.hasMore && !isLoading) fetchBooks(true, state.page);
        },
    });

    return (
        <div className="mx-auto w-full max-w-screen-2xl">
            <div className="flex flex-col gap-8">
                <section
                    className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    aria-label="Books gallery"
                >
                    {state.books.map((book) => (
                        <div
                            key={`${book.id}-${sortByType}`}
                            className="flex justify-center transition-opacity duration-300"
                            style={{ opacity: isLoading && state.page === 1 ? 0.5 : 1 }}
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
                    {!state.hasMore && state.books.length > 0 && (
                        <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                            You&apos;ve reached the end
                        </p>
                    )}
                </footer>
            </div>
        </div>
    );
};
