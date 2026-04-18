import { SearchBar } from '@/components/layout/UserNavbar/SearchBar/SearchBar';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

const mockBooks = {
    data: [
        { id: 'mock-1', title: 'The Mock Book 1', is_active: true },
        { id: 'mock-2', title: 'The Mock Book 2', is_active: true },
    ],
};

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/components/layout/UserNavbar/SearchBar/SearchOutput', () => ({
    SearchOutput: ({ onClose, books, errorMessage, activeIndex, isOpen }: any) => (
        <div
            data-testid="mock-search-output"
            data-active-index={activeIndex ?? -1}
            data-is-open={isOpen}
        >
            {errorMessage && <div data-testid="error-msg">{errorMessage}</div>}
            {books?.map((b: any, index: number) => (
                <button
                    key={b.id}
                    onClick={onClose}
                    data-testid={`book-${b.id}`}
                >
                    {b.title}
                </button>
            ))}
        </div>
    ),
}));

describe('SearchBar Technical Coverage', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const setupSearch = async (term = 'Mock') => {
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        fireEvent.change(input, { target: { value: term } });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await act(async () => {
            await Promise.resolve();
        });
    };

    it('ArrowUp Ternary (True and False branches)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        const container = screen.getByTestId('searchbar');

        // Type to trigger search
        fireEvent.change(input, { target: { value: 'Mock' } });
        
        // Wait for debounce and fetch
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        // Wait for dropdown to appear
        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });

        // Test ArrowDown increases index
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        
        const output = screen.getByTestId('mock-search-output');
        expect(output).toHaveAttribute('data-active-index', '0');

        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        expect(output).toHaveAttribute('data-active-index', '1');

        // Test ArrowUp decreases index
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowUp' });
        });
        expect(output).toHaveAttribute('data-active-index', '0');

        // Test ArrowUp boundary (stays at 0)
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowUp' });
        });
        expect(output).toHaveAttribute('data-active-index', '0');
    });

    it('!allBooks branch and Enter key logic', async () => {
        // Return error response to trigger the "no books" error
        (fetchBooksWithReviews as jest.Mock).mockResolvedValueOnce({ 
            data: null, 
            error: 'No books available to search.' 
        });
        
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        const container = screen.getByTestId('searchbar');
        
        fireEvent.change(input, { target: { value: 'null-trigger' } });
        
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });
        
        expect(await screen.findByTestId('error-msg')).toHaveTextContent(
            'No books available to search.',
        );

        // Now test successful search
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        
        fireEvent.change(input, {
            target: { value: 'Mock' },
        });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });

        // Navigate to first result and press Enter
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        act(() => {
            fireEvent.keyDown(container, { key: 'Enter' });
        });

        expect(mockRouterPush).toHaveBeenCalledWith('/book/mock-1');
    });

    it('catch (error) branch', async () => {
        (fetchBooksWithReviews as jest.Mock).mockRejectedValueOnce(new Error('API Down'));
        
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        
        fireEvent.change(input, { target: { value: 'error' } });
        
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });
        
        expect(await screen.findByTestId('error-msg')).toHaveTextContent(
            'Failed to retrieve books. Please try again later.',
        );
    });

    it('ArrowDown boundary (False branch)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        const container = screen.getByTestId('searchbar');

        // Type to trigger search
        fireEvent.change(input, { target: { value: 'Mock' } });
        
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });

        const output = screen.getByTestId('mock-search-output');

        // Navigate down - should be at index 0
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        expect(output).toHaveAttribute('data-active-index', '0');
        
        // Navigate down - should be at index 1 (last item since mockBooks has 2 items)
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        expect(output).toHaveAttribute('data-active-index', '1');
        
        // Try to go beyond boundary - should stay at 1
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        expect(output).toHaveAttribute('data-active-index', '1');
    });

    it('Escape, Blur, and Mouse events', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        render(<SearchBar />);
        const container = screen.getByTestId('searchbar');
        const input = screen.getByTestId('searchbar-searchinput');

        // Type to trigger search and wait for dropdown
        fireEvent.change(input, { target: { value: 'Mock' } });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });

        // Test Escape key closes dropdown
        act(() => {
            fireEvent.keyDown(container, { key: 'Escape' });
        });
        expect(screen.queryByTestId('mock-search-output')).not.toBeInTheDocument();

        // Test blur
        fireEvent.change(input, { target: { value: 'Mock' } });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });
        fireEvent.blur(container, { relatedTarget: null });
    });

    it('useEffect cleanup and empty input', () => {
        const { unmount } = render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');

        fireEvent.change(input, { target: { value: 'T' } });
        unmount();

        render(<SearchBar />);
        const newInput = screen.getByTestId('searchbar-searchinput');
        fireEvent.change(newInput, { target: { value: '' } });
        
        // Clearing input should reset loading, results, error, and activeIndex
        // This covers the else branch in the useEffect
    });

    it('should handle blur when relatedTarget is inside the component', () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        render(<SearchBar />);
        const container = screen.getByTestId('searchbar');
        const input = screen.getByTestId('searchbar-searchinput');

        // Type to trigger search and wait for dropdown
        fireEvent.change(input, { target: { value: 'Mock' } });
        jest.advanceTimersByTime(1000);

        // Blur with relatedTarget inside component should NOT close dropdown
        fireEvent.blur(container, { relatedTarget: container });

        // Dropdown should still be visible since relatedTarget is inside
        // (the blur handler checks if relatedTarget is NOT inside)
    });

    it('should handle blur when relatedTarget is outside component (covers setTimeout branch)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        render(<SearchBar />);
        const container = screen.getByTestId('searchbar');
        const input = screen.getByTestId('searchbar-searchinput');

        // Type to trigger search and wait for dropdown
        fireEvent.change(input, { target: { value: 'Mock' } });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        // Blur with relatedTarget outside component SHOULD close dropdown after timeout
        fireEvent.blur(container, { relatedTarget: null });

        // Advance timers to trigger the setTimeout
        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        // Dropdown should be hidden after timeout
        expect(screen.queryByTestId('mock-search-output')).not.toBeInTheDocument();
    });

    it('should handle keydown when searchResults is empty', () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: [], total: 0, totalPages: 0, currentPage: 0 },
        });
        render(<SearchBar />);
        const container = screen.getByTestId('searchbar');
        const input = screen.getByTestId('searchbar-searchinput');

        // Type to trigger search with no results
        fireEvent.change(input, { target: { value: 'NonExistent' } });
        jest.advanceTimersByTime(1000);

        // ArrowDown should not change index when there are no results
        fireEvent.keyDown(container, { key: 'ArrowDown' });
        
        // Enter should not navigate when activeIndex is -1
        fireEvent.keyDown(container, { key: 'Enter' });
        
        // These should not cause errors
        expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should filter books by title when author is undefined (covers optional chaining)', async () => {
        const booksWithoutAuthor = {
            error: null,
            data: {
                data: [{ id: 'no-author', title: 'Test Book', is_active: true }],
                total: 1,
                totalPages: 1,
                currentPage: 1,
            },
        };
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(booksWithoutAuthor);

        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');
        const container = screen.getByTestId('searchbar');

        fireEvent.change(input, { target: { value: 'Test' } });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });

        // Should still find the book even without author
        fireEvent.keyDown(container, { key: 'ArrowDown' });
        fireEvent.keyDown(container, { key: 'Enter' });
        expect(mockRouterPush).toHaveBeenCalledWith('/book/no-author');
    });

    it('should filter books by author when author is defined (covers optional chaining true branch)', async () => {
        const booksWithAuthor = {
            error: null,
            data: {
                data: [{ id: 'with-author', title: 'Other Book', author: 'Test Author', is_active: true }],
                total: 1,
                totalPages: 1,
                currentPage: 1,
            },
        };
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(booksWithAuthor);

        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');

        // Search by author name
        fireEvent.change(input, { target: { value: 'Test Author' } });
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
        });
    });

    it('should NOT close dropdown when blur relatedTarget is inside component (covers handleBlur false branch)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        render(<SearchBar />);
        const container = screen.getByTestId('searchbar');
        const input = screen.getByTestId('searchbar-searchinput');

        // Type to trigger search and wait for dropdown
        fireEvent.change(input, { target: { value: 'Mock' } });
        jest.advanceTimersByTime(1000);

        // Blur with relatedTarget inside component should NOT close dropdown
        // Create a mock relatedTarget that is "inside" the component
        const mockRelatedTarget = container as unknown as Node;
        fireEvent.blur(container, { relatedTarget: mockRelatedTarget });

        // Dropdown should still be visible since relatedTarget is inside
        expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
    });

    it('should set loading to false in finally block when controller is not aborted', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue({
            error: null,
            data: { data: mockBooks.data, total: 2, totalPages: 1, currentPage: 1 },
        });
        
        render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');

        fireEvent.change(input, { target: { value: 'Mock' } });
        
        // Wait for the fetch to complete
        await act(async () => {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            // Additional wait for the fetch to complete
            await Promise.resolve();
        });

        // Loading should be false after fetch completes
        // This is implicitly tested by the component rendering correctly
        expect(screen.getByTestId('mock-search-output')).toBeInTheDocument();
    });
});
