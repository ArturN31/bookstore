import { renderHook, act } from '@testing-library/react';
import { useBookSearch } from '@/hooks/SearchBar/useBookSearch';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';

jest.mock('@/data/books/GetBooksData');

describe('useBookSearch', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update input and debounce API call', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: [{ id: '1', title: 'Test', is_active: true }] },
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'Test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(fetchBooksWithReviews).toHaveBeenCalledTimes(1);
    });

    it('should handle request aborts gracefully', async () => {
        let resolvePromise: (value: { error: null; data: { data: Book[] } }) => void;
        const promise = new Promise<{ error: null; data: { data: Book[] } }>((resolve) => {
            resolvePromise = resolve;
        });
        (fetchBooksWithReviews as jest.Mock).mockReturnValue(promise);

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'first' },
            } as React.ChangeEvent<HTMLInputElement>);
        });
        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        act(() => {
            result.current.handleInputChange({
                target: { value: 'second' },
            } as React.ChangeEvent<HTMLInputElement>);
        });
        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolvePromise({ error: null, data: { data: [] } });
        });
    });

    it('should set error message when no matching books are found', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: [{ id: '1', title: 'Different', is_active: true }] },
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'xyz' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe('No matching books found.');
    });

    it('should handle non-AbortError fetch failures', async () => {
        (fetchBooksWithReviews as jest.Mock).mockRejectedValue(new Error('Network Fail'));

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe(
            'Failed to retrieve books. Please try again later.',
        );
    });

    it('should clear results when input is cleared', async () => {
        const { result } = renderHook(() => useBookSearch());

        await act(async () => {
            result.current.handleInputChange({
                target: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.searchResults).toEqual([]);
        expect(result.current.errorMessage).toBeNull();
    });

    it('should clear state when clearSearch is called', () => {
        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.setSearchResults([{ id: '1', title: 'Test' } as Book]);
        });

        act(() => {
            result.current.clearSearch();
        });

        expect(result.current.searchResults).toEqual([]);
        expect(result.current.input).toBe('');
        expect(result.current.errorMessage).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should set error message when API returns an error', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: 'API Error',
            data: null,
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe('API Error');
        expect(result.current.searchResults).toEqual([]);
    });

    it('should abort pending request when input is cleared to empty', async () => {
        const promise = new Promise<{ error: null; data: { data: Book[] } }>(() => {});
        (fetchBooksWithReviews as jest.Mock).mockReturnValue(promise);

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        act(() => {
            result.current.handleInputChange({
                target: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.searchResults).toEqual([]);
    });

    it('should trigger abort in clearSearch when request is active', async () => {
        (fetchBooksWithReviews as jest.Mock).mockReturnValue(new Promise(() => {}));
        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        act(() => {
            result.current.clearSearch();
        });

        expect(result.current.input).toBe('');
    });

    it('should handle API error responses', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: 'Database Error',
            data: null,
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe('Database Error');
    });

    it('should abort pending request when input is cleared to empty', async () => {
        (fetchBooksWithReviews as jest.Mock).mockReturnValue(new Promise(() => {}));
        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        act(() => {
            result.current.handleInputChange({
                target: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should show default error message when response data is missing (Line 39)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: null,
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe('No books available to search.');
    });

    it('should handle response.data.data being undefined (Line 44)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: {},
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.searchResults).toEqual([]);
    });

    it('should filter correctly when book author is missing (Line 50)', async () => {
        const mockBooks = [
            { id: '1', title: 'Find Me', is_active: true },
            { id: '2', title: 'Other', author: 'Author Name', is_active: true },
        ];

        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks },
        });

        const { result } = renderHook(() => useBookSearch());

        act(() => {
            result.current.handleInputChange({
                target: { value: 'Find Me' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.searchResults).toHaveLength(1);
        expect(result.current.searchResults[0].id).toBe('1');
    });

    it('should ignore AbortError but handle other errors (Line 57)', async () => {
        const { result } = renderHook(() => useBookSearch());

        const abortError = new DOMException('The user aborted a request.', 'AbortError');
        (fetchBooksWithReviews as jest.Mock).mockRejectedValueOnce(abortError);

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test1' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBeNull();

        const networkError = new Error('Network failure');
        (fetchBooksWithReviews as jest.Mock).mockRejectedValueOnce(networkError);

        act(() => {
            result.current.handleInputChange({
                target: { value: 'test2' },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
        });

        expect(result.current.errorMessage).toBe(
            'Failed to retrieve books. Please try again later.',
        );
    });
});
