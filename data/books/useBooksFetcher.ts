import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedBookResult } from './BookConstants';
import { BookQueryParams } from './BookRepository';
import { fetchBooksWithReviews } from './GetBooksData';

interface ActionResponse<T> {
    data: T | null;
    error: string | null;
}

interface UseBooksFetcherProps {
    initialData: ActionResponse<PaginatedBookResult>;
    queryParams?: Omit<BookQueryParams, 'page' | 'limit'>;
    sortByType: string;
}

interface FetchState {
    books: PaginatedBookResult['data'];
    page: number;
    hasMore: boolean;
}

export const useBooksFetcher = ({ initialData, queryParams, sortByType }: UseBooksFetcherProps) => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const previousSortByTypeRef = useRef<string>(sortByType);
    const previousParamsRef = useRef<string>(JSON.stringify(queryParams));

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
            targetParams: Omit<BookQueryParams, 'page' | 'limit'> | undefined,
            targetSortOrder: string,
        ) => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setIsLoading(true);
            try {
                const response = await fetchBooksWithReviews({
                    ...targetParams,
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
                if (!(err instanceof DOMException && err.name === 'AbortError')) {
                    console.error('Failed to fetch books:', err);
                }
            } finally {
                if (abortControllerRef.current === controller) setIsLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        const currentParamsStr = JSON.stringify(queryParams);
        const hasSortByChanged = previousSortByTypeRef.current !== sortByType;
        const haveParamsChanged = previousParamsRef.current !== currentParamsStr;

        if (hasSortByChanged || haveParamsChanged) {
            previousSortByTypeRef.current = sortByType;
            previousParamsRef.current = currentParamsStr;

            executeFetchOperation(false, 1, queryParams, sortByType);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [sortByType, queryParams, executeFetchOperation]);

    const fetchBooks = useCallback(
        (isNextPage: boolean, currentPageNum: number) => {
            executeFetchOperation(isNextPage, currentPageNum, queryParams, sortByType);
        },
        [executeFetchOperation, queryParams, sortByType],
    );

    return { state, isLoading, fetchBooks };
};
