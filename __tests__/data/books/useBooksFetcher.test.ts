import { renderHook, act, waitFor } from '@testing-library/react';
import { PaginatedBookResult } from '@/data/books/BookConstants';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { useBooksFetcher } from '@/data/books/useBooksFetcher';

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

const mockFetch = fetchBooksWithReviews as jest.Mock;

describe('useBooksFetcher hook coverage', () => {
    type Book = PaginatedBookResult['data'][number];
    const mockBookA: Book = { id: 'a', title: 'Book A' } as Book;
    const mockBookB: Book = { id: 'b', title: 'Book B' } as Book;
    const stableFilters = {};

    beforeEach(() => {
        jest.clearAllMocks();
        window.scrollTo = jest.fn();
    });

    it('should handle pagination (true) and refresh (false) correctly', async () => {
        mockFetch
            .mockResolvedValueOnce({
                data: { data: [mockBookA], currentPage: 1, totalPages: 2, total: 2 },
                error: null,
            })
            .mockResolvedValueOnce({
                data: { data: [mockBookB], currentPage: 2, totalPages: 2, total: 2 },
                error: null,
            });

        const { result } = renderHook(() =>
            useBooksFetcher({
                initialData: {
                    data: { data: [], currentPage: 1, totalPages: 2, total: 2 },
                    error: null,
                },
                filterType: 'Title: A-Z',
                filters: stableFilters,
            }),
        );

        await act(async () => {
            await result.current.fetchBooks(false, 1);
        });
        expect(result.current.state.books).toEqual([mockBookA]);

        await act(async () => {
            await result.current.fetchBooks(true, 1);
        });
        expect(result.current.state.books).toEqual([mockBookA, mockBookB]);
    });

    it('should return early if the controller signal is aborted', async () => {
        let resolve1: (value: any) => void;
        const promise1 = new Promise((r) => {
            resolve1 = r;
        });

        mockFetch.mockReturnValueOnce(promise1).mockResolvedValue({
            data: { data: [mockBookB], currentPage: 1, totalPages: 1, total: 1 },
            error: null,
        });

        const { result } = renderHook(() =>
            useBooksFetcher({
                initialData: { data: null, error: null },
                filterType: 'Title: A-Z',
                filters: stableFilters,
            }),
        );

        await act(async () => {
            await result.current.fetchBooks(false, 1);
        });

        await act(async () => {
            await result.current.fetchBooks(false, 1);
        });

        await act(async () => {
            resolve1({
                data: { data: [mockBookA], currentPage: 1, totalPages: 1, total: 1 },
                error: null,
            });
        });

        expect(result.current.state.books).toEqual([mockBookB]);
    });

    it('should swallow AbortError and not log it', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const abortError = new DOMException('Abort', 'AbortError');

        mockFetch.mockRejectedValue(abortError);

        const { result } = renderHook(() =>
            useBooksFetcher({
                initialData: { data: null, error: null },
                filterType: 'Popularity',
                filters: stableFilters,
            }),
        );

        await act(async () => {
            try {
                await result.current.fetchBooks(false, 1);
            } catch (e) {
                //
            }
        });

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should log generic errors to console', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const genericError = new Error('Network Fail');

        mockFetch.mockRejectedValue(genericError);

        const { result } = renderHook(() =>
            useBooksFetcher({
                initialData: { data: null, error: null },
                filterType: 'Popularity',
                filters: stableFilters,
            }),
        );

        await act(async () => {
            try {
                await result.current.fetchBooks(false, 1);
            } catch (e) {
                //
            }
        });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch books:', genericError);
        consoleSpy.mockRestore();
    });

    it('should not update state if response contains error', async () => {
        mockFetch.mockResolvedValueOnce({ data: null, error: 'API Error' });

        const { result } = renderHook(() =>
            useBooksFetcher({
                initialData: {
                    data: { data: [mockBookA], currentPage: 1, totalPages: 1, total: 1 },
                    error: null,
                },
                filterType: 'Title: A-Z',
                filters: stableFilters,
            }),
        );

        await act(async () => {
            await result.current.fetchBooks(false, 1);
        });

        expect(result.current.state.books).toEqual([mockBookA]);
    });
});
