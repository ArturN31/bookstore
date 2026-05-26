'use client';

import { useInView } from 'react-intersection-observer';
import { useBookFilter } from '@/providers/BookFilterProvider';
import { BookCard } from '@/components/books/bookCard/BookCard';
import { PaginatedBookResult } from '@/data/books/BookConstants';
import { FetchBooksFilters } from '@/data/books/BookRepository';
import { useBooksFetcher } from '@/data/books/useBooksFetcher';

interface BooksManagerProps {
    initialData: ActionResponse<PaginatedBookResult>;
    filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
}

export const BooksManager = ({ initialData, filters }: BooksManagerProps) => {
    const { filterType } = useBookFilter();

    const { state, isLoading, fetchBooks } = useBooksFetcher({
        initialData,
        filters,
        filterType,
    });

    const { ref: observerRef } = useInView({
        threshold: 0,
        rootMargin: '400px',
        onChange: (inView) => {
            if (inView && state.hasMore && !isLoading) {
                fetchBooks(true, state.page);
            }
        },
    });

    return (
        <div className="mx-auto w-full max-w-screen-2xl">
            <div className="flex flex-col gap-8">
                <section
                    className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    aria-label="Books gallery"
                >
                    {state.books.map((book) => (
                        <div
                            key={`${book.id}-${filterType}`}
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
