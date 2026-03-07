import { SearchBar } from '@/components/layout/UserNavbar/SearchBar/SearchBar';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
    SearchOutput: ({ onClose, books, errorMessage, activeIndex }: any) => (
        <div
            data-testid="mock-search-output"
            data-active-index={activeIndex}
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
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(mockBooks);
        await setupSearch();
        const container = screen.getByTestId('searchbar');

        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });

        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowUp' });
        });
        expect(screen.getByTestId('mock-search-output')).toHaveAttribute('data-active-index', '0');

        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowUp' });
        });
        expect(screen.getByTestId('mock-search-output')).toHaveAttribute('data-active-index', '0');
    });

    it('!allBooks branch and Enter key logic', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValueOnce(null);
        await setupSearch('null-trigger');
        expect(await screen.findByTestId('error-msg')).toHaveTextContent(
            'No books available to search.',
        );

        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(mockBooks);
        fireEvent.change(screen.getByTestId('searchbar-searchinput'), {
            target: { value: 'Mock' },
        });
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        await act(async () => {
            await Promise.resolve();
        });

        const container = screen.getByTestId('searchbar');
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
        await setupSearch('error');
        expect(await screen.findByTestId('error-msg')).toHaveTextContent(
            'Failed to retrieve books.',
        );
    });

    it('ArrowDown boundary (False branch)', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(mockBooks);
        await setupSearch();
        const container = screen.getByTestId('searchbar');

        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        act(() => {
            fireEvent.keyDown(container, { key: 'ArrowDown' });
        });
        expect(screen.getByTestId('mock-search-output')).toHaveAttribute('data-active-index', '1');
    });

    it('Escape, Blur, and Mouse events', async () => {
        (fetchBooksWithReviews as jest.Mock).mockResolvedValue(mockBooks);
        await setupSearch();
        const container = screen.getByTestId('searchbar');

        act(() => {
            fireEvent.keyDown(container, { key: 'Escape' });
        });
        expect(screen.queryByTestId('mock-search-output')).not.toBeInTheDocument();

        fireEvent.mouseEnter(container);
        fireEvent.mouseLeave(container);
        fireEvent.blur(container, { relatedTarget: null });
    });

    it('useEffect cleanup and empty input', () => {
        const { unmount } = render(<SearchBar />);
        const input = screen.getByTestId('searchbar-searchinput');

        fireEvent.change(input, { target: { value: 'T' } });
        unmount();

        render(<SearchBar />);
        fireEvent.change(screen.getByTestId('searchbar-searchinput'), { target: { value: '' } });
    });
});
