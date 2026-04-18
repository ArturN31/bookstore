import { BooksManager } from '@/components/books/BooksManager';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { useBookFilter } from '@/providers/BookFilterProvider';
import { render, screen, waitFor } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/providers/BookFilterProvider', () => ({
    useBookFilter: jest.fn(),
}));

jest.mock('react-intersection-observer', () => ({
    useInView: jest.fn(),
}));

jest.mock('@/components/books/bookCard/BookCard', () => ({
    BookCard: ({ book }: { book: any }) => <div data-testid="mock-book-card">{book.title}</div>,
}));

const createMockBook = (overrides: any) => ({
    id: '1',
    title: 'Default',
    author: 'Author',
    genre: 'Genre',
    description: 'Desc',
    price: 10,
    stock: 5,
    rating: 4,
    reviews_count: 10,
    image_url: '',
    isbn: '123',
    publisher: 'Pub',
    publication_date: '2024',
    format: 'Paperback',
    page_count: 200,
    language: 'English',
    categories: [],
    created_at: '',
    updated_at: '',
    ...overrides,
});

const mockInitialData = {
    error: null,
    data: {
        data: [createMockBook({ id: '1', title: 'Book 1' })],
        currentPage: 1,
        totalPages: 2,
        totalItems: 2,
        total: 2,
    },
};

describe('BooksManager', () => {
    const mockFetch = fetchBooksWithReviews as jest.Mock;
    const mockUseBookFilter = useBookFilter as jest.Mock;
    const mockUseInView = useInView as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseBookFilter.mockReturnValue({ filterType: 'Title: A-Z' });
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });
        mockFetch.mockResolvedValue({
            data: [],
            totalPages: 1,
            currentPage: 1,
            total: 0,
            error: null,
        });

        window.scrollTo = jest.fn();
    });

    it('renders initial data correctly', () => {
        render(<BooksManager initialData={mockInitialData} />);
        expect(screen.getByText('Book 1')).toBeInTheDocument();
    });

    it('shows empty state when no books are provided in initialData', () => {
        const emptyData = {
            error: null,
            data: {
                data: [],
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                total: 0,
            },
        };

        render(<BooksManager initialData={emptyData} />);

        // BooksManager doesn't show empty state text, it just renders empty grid
        expect(screen.queryByTestId('mock-book-card')).not.toBeInTheDocument();
    });

    it('triggers loadMore when scrolling to bottom', async () => {
        const nextData = {
            error: null,
            data: {
                data: [createMockBook({ id: '2', title: 'Book 2' })],
                totalPages: 2,
                currentPage: 2,
                total: 2,
            },
        };
        mockFetch.mockResolvedValueOnce(nextData);
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

        render(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(screen.getByText('Book 2')).toBeInTheDocument();
        });
    });

    it('resets and reloads books when filterType changes', async () => {
        const sortedData = {
            error: null,
            data: {
                data: [createMockBook({ id: '3', title: 'Sorted Book' })],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        };
        mockFetch.mockResolvedValueOnce(sortedData);

        const { rerender } = render(<BooksManager initialData={mockInitialData} />);

        mockUseBookFilter.mockReturnValue({ filterType: 'Price: Low to High' });
        rerender(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(screen.getByText('Sorted Book')).toBeInTheDocument();
        });
    });

    it('handles fetch errors gracefully (Fixed Logic)', async () => {
        mockFetch.mockResolvedValue({
            data: [],
            error: 'Failed to fetch',
            totalPages: 0,
            currentPage: 0,
        });

        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

        render(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        expect(screen.getByText('Book 1')).toBeInTheDocument();
        expect(screen.queryByText('Book 2')).not.toBeInTheDocument();
    });

    it('handles fetch rejection with non-AbortError', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

        render(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch books:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('scrolls to top when fetching first page (not next page)', async () => {
        const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
        
        const sortedData = {
            error: null,
            data: {
                data: [createMockBook({ id: '3', title: 'Sorted Book' })],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        };
        mockFetch.mockResolvedValueOnce(sortedData);

        const { rerender } = render(<BooksManager initialData={mockInitialData} />);

        mockUseBookFilter.mockReturnValue({ filterType: 'Price: Low to High' });
        rerender(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        });

        scrollSpy.mockRestore();
    });

    it('does not scroll when fetching next page', async () => {
        const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
        
        const nextData = {
            error: null,
            data: {
                data: [createMockBook({ id: '2', title: 'Book 2' })],
                totalPages: 2,
                currentPage: 2,
                total: 2,
            },
        };
        mockFetch.mockResolvedValueOnce(nextData);
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

        render(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(screen.getByText('Book 2')).toBeInTheDocument();
        });

        // scrollTo should NOT be called for next page
        expect(scrollSpy).not.toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        
        scrollSpy.mockRestore();
    });

    it('initializes hasMore correctly when currentPage equals totalPages', () => {
        const noMoreData = {
            error: null,
            data: {
                data: [createMockBook({ id: '1', title: 'Book 1' })],
                currentPage: 5,
                totalPages: 5,
                totalItems: 90,
                total: 90,
            },
        };

        render(<BooksManager initialData={noMoreData} />);

        // hasMore should be false when currentPage === totalPages
        // The "You've reached the end" message should appear instead of loading spinner
        expect(screen.getByText(/you've reached the end/i)).toBeInTheDocument();
    });

    it('handles undefined initialData.data with default values (covers lines 20-24 ?? branches)', () => {
        const emptyInitialData = {
            error: null,
            data: undefined,
        };

        // Should not crash with undefined data
        const { container } = render(<BooksManager initialData={emptyInitialData as any} />);
        
        // Should render the empty state (no books gallery)
        expect(container.querySelector('[aria-label="Books gallery"]')).toBeInTheDocument();
    });

    it('handles AbortError without logging to console (covers line 66 false branch)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Create an AbortError
        const abortError = new DOMException('Aborted', 'AbortError');
        mockFetch.mockRejectedValueOnce(abortError);
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true });

        render(<BooksManager initialData={mockInitialData} />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });

        // Console.error should NOT be called for AbortError
        expect(consoleSpy).not.toHaveBeenCalledWith('Failed to fetch books:', expect.any(Error));
        
        consoleSpy.mockRestore();
    });
});
