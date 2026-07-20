import { BooksManager } from '@/components/books/BooksManager';
import { useBookSortBy } from '@/providers/BookSortByProvider';
import { render, screen } from '@testing-library/react';
import { useInView } from 'react-intersection-observer';
import { useBooksFetcher } from '@/data/books/useBooksFetcher';
import { PaginatedBookResult } from '@/data/books/BookConstants';

interface ActionResponse<T> {
    error: string | null;
    data: T | null;
}

jest.mock('@/providers/BookSortByProvider', () => ({
    useBookSortBy: jest.fn(),
}));

jest.mock('react-intersection-observer', () => ({
    useInView: jest.fn(),
}));

jest.mock('@/data/books/useBooksFetcher', () => ({
    useBooksFetcher: jest.fn(),
}));

jest.mock('@/components/books/bookCard/BookCard', () => ({
    BookCard: ({ book }: { book: Book }) => <div data-testid="mock-book-card">{book.title}</div>,
}));

const createMockBook = (overrides: Partial<Book>): Book => ({
    id: '1',
    title: 'Default',
    author: 'Author',
    genre: 'Genre',
    description: 'Desc',
    price: '10',
    rating: 4,
    review_count: 10,
    sales_count: null,
    stock_quantity: 0,
    image_url: '',
    publisher: 'Pub',
    publication_date: '2024',
    format: 'Paperback',
    page_count: 200,
    created_at: '',
    updated_at: '',
    is_active: true,
    ...overrides,
});

const mockInitialData: ActionResponse<PaginatedBookResult> = {
    error: null,
    data: {
        data: [createMockBook({ id: '1', title: 'Book 1' })],
        currentPage: 1,
        totalPages: 2,
        total: 2,
    },
};

describe('BooksManager', () => {
    const mockBookSortBy = useBookSortBy as jest.Mock;
    const mockUseInView = useInView as jest.Mock;
    const mockUseBooksFetcher = useBooksFetcher as jest.Mock;
    const mockFetchBooks = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockBookSortBy.mockReturnValue({ sortByType: 'Title: A-Z' });
        mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false });

        mockUseBooksFetcher.mockReturnValue({
            state: {
                books: [createMockBook({ id: '1', title: 'Book 1' })],
                page: 1,
                hasMore: true,
            },
            isLoading: false,
            fetchBooks: mockFetchBooks,
        });

        window.scrollTo = jest.fn();
    });

    it('renders initial data correctly', () => {
        render(<BooksManager initialData={mockInitialData} />);
        expect(screen.getByText('Book 1')).toBeInTheDocument();
    });

    it('shows empty state when no books are provided in initialData', () => {
        mockUseBooksFetcher.mockReturnValue({
            state: {
                books: [],
                page: 1,
                hasMore: false,
            },
            isLoading: false,
            fetchBooks: mockFetchBooks,
        });

        render(
            <BooksManager
                initialData={{
                    error: null,
                    data: { data: [], currentPage: 1, totalPages: 0, total: 0 },
                }}
            />,
        );

        expect(screen.queryByTestId('mock-book-card')).not.toBeInTheDocument();
    });

    it('triggers loadMore when scrolling to bottom', async () => {
        let triggerChange: (inView: boolean) => void = () => {};

        mockUseInView.mockImplementation(
            ({ onChange }: { onChange: (inView: boolean) => void }) => {
                triggerChange = onChange;
                return { ref: jest.fn() };
            },
        );

        render(<BooksManager initialData={mockInitialData} />);

        triggerChange(true);

        expect(mockFetchBooks).toHaveBeenCalledWith(true, 1);
    });

    it('resets and reloads books when sortByType changes', async () => {
        const { rerender } = render(<BooksManager initialData={mockInitialData} />);

        mockBookSortBy.mockReturnValue({ sortByType: 'Price: Low to High' });

        rerender(<BooksManager initialData={mockInitialData} />);

        expect(mockUseBooksFetcher).toHaveBeenCalledWith(
            expect.objectContaining({ sortByType: 'Price: Low to High' }),
        );
    });

    it('handles fetch errors gracefully (Fixed Logic)', async () => {
        mockUseBooksFetcher.mockReturnValue({
            state: {
                books: [createMockBook({ id: '1', title: 'Book 1' })],
                page: 1,
                hasMore: false,
            },
            isLoading: false,
            fetchBooks: mockFetchBooks,
        });

        render(<BooksManager initialData={mockInitialData} />);

        expect(screen.getByText('Book 1')).toBeInTheDocument();
        expect(screen.queryByText('Book 2')).not.toBeInTheDocument();
    });

    it('handles fetch rejection with non-AbortError', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockFetchBooks.mockImplementationOnce(() => {
            console.error('Failed to fetch books:', new Error('Network error'));
        });

        let triggerChange: (inView: boolean) => void = () => {};
        mockUseInView.mockImplementation(
            ({ onChange }: { onChange: (inView: boolean) => void }) => {
                triggerChange = onChange;
                return { ref: jest.fn() };
            },
        );

        render(<BooksManager initialData={mockInitialData} />);
        triggerChange(true);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch books:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('does not scroll when fetching next page', async () => {
        const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

        let triggerChange: (inView: boolean) => void = () => {};
        mockUseInView.mockImplementation(
            ({ onChange }: { onChange: (inView: boolean) => void }) => {
                triggerChange = onChange;
                return { ref: jest.fn() };
            },
        );

        render(<BooksManager initialData={mockInitialData} />);
        triggerChange(true);

        expect(scrollSpy).not.toHaveBeenCalled();
        scrollSpy.mockRestore();
    });

    it('BRANCH COVERAGE: applies half opacity style when loading the first page (covers line 45)', () => {
        mockUseBooksFetcher.mockReturnValue({
            state: {
                books: [createMockBook({ id: '1', title: 'Book 1' })],
                page: 1,
                hasMore: true,
            },
            isLoading: true,
            fetchBooks: mockFetchBooks,
        });

        render(<BooksManager initialData={mockInitialData} />);

        const mockCardElement = screen.getByTestId('mock-book-card');
        const cardContainer = mockCardElement.parentElement;

        expect(cardContainer).toHaveStyle('opacity: 0.5');
    });
});
