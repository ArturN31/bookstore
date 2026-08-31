import { render, screen } from '@testing-library/react';
import { fetchRelatedBooks } from '@/data/books/BookService';
import { RelatedBooks } from '@/app/book/[slug]/components/RelatedBooks/RelatedBooks';

const mockedFetchRelatedBooks = fetchRelatedBooks as jest.Mock;

jest.mock('@/data/books/BookService', () => ({
    fetchRelatedBooks: jest.fn(),
}));

jest.mock('@/components/books/BooksCarousel/BooksCarousel', () => ({
    BooksCarousel: ({ books }: { books: Array<{ id: string; title: string }> }) => (
        <div data-testid="books-carousel">
            {books.map((book) => (
                <span key={book.id}>{book.title}</span>
            ))}
        </div>
    ),
}));

const mockRelatedBooks = [
    {
        id: 'book-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Related Book One',
        author: 'Author One',
        genre: 'Fiction',
        publisher: 'Publisher One',
        publication_date: '2023-01-01',
        price: '19.99',
        description: 'Mock Description',
        format: 'Hardcover',
        page_count: 300,
        image_url: 'http://example.com/1.jpg',
        stock_quantity: 10,
        is_active: true,
        rating: 5,
        sales_count: null,
    },
];

describe('RelatedBooks Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render null when fetchRelatedBooks returns an error', async () => {
        mockedFetchRelatedBooks.mockResolvedValue({
            data: null,
            error: 'Database error',
        });

        const element = await RelatedBooks({ bookId: '123' });
        const { container } = render(element);

        expect(container).toBeEmptyDOMElement();
        expect(mockedFetchRelatedBooks).toHaveBeenCalledWith('123', 12);
    });

    it('should render null when fetchRelatedBooks returns null data', async () => {
        mockedFetchRelatedBooks.mockResolvedValue({
            data: null,
            error: null,
        });

        const element = await RelatedBooks({ bookId: '123' });
        const { container } = render(element);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render null when fetchRelatedBooks returns an empty array', async () => {
        mockedFetchRelatedBooks.mockResolvedValue({
            data: [],
            error: null,
        });

        const element = await RelatedBooks({ bookId: '123' });
        const { container } = render(element);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render RelatedBooks carousel when fetch succeeds with books', async () => {
        mockedFetchRelatedBooks.mockResolvedValue({
            data: mockRelatedBooks,
            error: null,
        });

        const element = await RelatedBooks({ bookId: '123', limit: 6 });
        render(element);

        expect(mockedFetchRelatedBooks).toHaveBeenCalledWith('123', 6);
        expect(screen.getByRole('region', { name: 'Related Books' })).toBeInTheDocument();
        expect(screen.getByTestId('books-carousel')).toBeInTheDocument();
        expect(screen.getByText('Related Book One')).toBeInTheDocument();
    });
});
