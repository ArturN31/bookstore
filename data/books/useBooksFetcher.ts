import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedBookResult } from './BookConstants';
import { FetchBooksFilters } from './BookRepository';
import { fetchBooksWithReviews } from './GetBooksData';

interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

interface UseBooksFetcherProps {
    initialData: ActionResponse<PaginatedBookResult>;
    filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
    filterType: string;
}

interface FetchState {
    books: PaginatedBookResult['data'];
    page: number;
    hasMore: boolean;
}

export const useBooksFetcher = ({ initialData, filters, filterType }: UseBooksFetcherProps) => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [state, setState] = useState<FetchState>({
        books: initialData.data?.data ?? [],
        page: initialData.data?.currentPage ?? 1,
        hasMore: (initialData.data?.currentPage ?? 1) < (initialData.data?.totalPages ?? 1),
    });

    const executeFetchOperation = useCallback(
        async (
            isNextPage: boolean,
            currentPageNum: number,
            targetFilters: Omit<FetchBooksFilters, 'page' | 'limit'> | undefined,
            targetSortOrder: string,
        ) => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsLoading(true);
            try {
                const response = await fetchBooksWithReviews({
                    ...targetFilters,
                    sortBy: targetSortOrder,
                    page: isNextPage ? currentPageNum + 1 : 1,
                    limit: 18,
                });

                if (controller.signal.aborted) return;

                if (!response.error && response.data) {
                    const { data: newBooks, totalPages, currentPage } = response.data;
                    setState((prev) => ({
                        books: isNextPage ? [...prev.books, ...newBooks] : newBooks,
                        page: currentPage,
                        hasMore: currentPage < totalPages,
                    }));
                }
            } catch (err: unknown) {
                if (!(err instanceof DOMException && err.name === 'AbortError'))
                    console.error('Failed to fetch books:', err);
            } finally {
                if (abortControllerRef.current === controller) setIsLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (initialData.data && filterType === 'Title: A-Z' && state.page === 1) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        executeFetchOperation(false, 1, filters, filterType);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, filters]);

    const fetchBooks = useCallback(
        (isNextPage: boolean, currentPageNum: number) => {
            executeFetchOperation(isNextPage, currentPageNum, filters, filterType);
        },
        [executeFetchOperation, filters, filterType],
    );

    return { state, isLoading, fetchBooks };
};
