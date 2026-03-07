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
    data: [createMockBook({ id: '1', title: 'Book 1' })],
    currentPage: 1,
    totalPages: 2,
    totalItems: 2,
    total: 2,
    error: null,
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
            data: [],
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            total: 0,
            error: null,
        };

        render(<BooksManager initialData={emptyData} />);

        expect(screen.getByText(/No books found matching your criteria/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Books gallery/i)).not.toBeInTheDocument();
    });

    it('triggers loadMore when scrolling to bottom', async () => {
        const nextData = {
            data: [createMockBook({ id: '2', title: 'Book 2' })],
            totalPages: 2,
            currentPage: 2,
            total: 2,
            error: null,
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
            data: [createMockBook({ id: '3', title: 'Sorted Book' })],
            totalPages: 1,
            currentPage: 1,
            total: 1,
            error: null,
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
});
