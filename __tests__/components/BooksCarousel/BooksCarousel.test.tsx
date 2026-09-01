import { BooksCarousel } from '@/components/books/BooksCarousel/BooksCarousel';
import { useCarouselScroll } from '@/components/books/BooksCarousel/useCarouselScroll';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/books/BooksCarousel/useCarouselScroll');
const mockedUseCarouselScroll = useCarouselScroll as unknown as jest.Mock;

jest.mock('@/components/books/bookCard/BookCard', () => ({
    BookCard: ({ book }: { book: { title: string } }) => (
        <div data-testid="book-card">{book.title}</div>
    ),
}));

jest.mock('@/components/books/BooksCarousel/BooksNavigationButtons', () => ({
    BooksNavigationButtons: ({
        canScrollLeft,
        canScrollRight,
    }: {
        canScrollLeft: boolean;
        canScrollRight: boolean;
    }) => (
        <div data-testid="nav-buttons">
            <span data-testid="can-scroll-left">{String(canScrollLeft)}</span>
            <span data-testid="can-scroll-right">{String(canScrollRight)}</span>
        </div>
    ),
    RelatedBooksNavigationButtons: ({
        canScrollLeft,
        canScrollRight,
    }: {
        canScrollLeft: boolean;
        canScrollRight: boolean;
    }) => (
        <div data-testid="nav-buttons">
            <span data-testid="can-scroll-left">{String(canScrollLeft)}</span>
            <span data-testid="can-scroll-right">{String(canScrollRight)}</span>
        </div>
    ),
}));

const mockBooks = [
    {
        id: 'book-1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'First Book',
        author: 'Author A',
        genre: 'Fiction',
        publisher: 'Publisher A',
        publication_date: '2023-01-01',
        price: '15.00',
        description: 'Desc A',
        format: 'Hardcover',
        page_count: 200,
        image_url: 'http://example.com/a.jpg',
        stock_quantity: 5,
        is_active: true,
        rating: 4,
        sales_count: null,
    },
    {
        id: 'book-2',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Second Book',
        author: 'Author B',
        genre: 'Sci-Fi',
        publisher: 'Publisher B',
        publication_date: '2023-01-01',
        price: '25.00',
        description: 'Desc B',
        format: 'Paperback',
        page_count: 350,
        image_url: 'http://example.com/b.jpg',
        stock_quantity: 8,
        is_active: true,
        rating: 5,
        sales_count: null,
    },
];

describe('BooksCarousel Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseCarouselScroll.mockReturnValue({
            scrollContainerRef: { current: null },
            canScrollLeft: false,
            canScrollRight: true,
            handleScroll: jest.fn(),
        });
    });

    it('should render the heading and description for related books mode', () => {
        render(
            <BooksCarousel
                books={mockBooks}
                mode="related_books"
            />,
        );

        expect(
            screen.getByRole('heading', { level: 2, name: 'You Might Also Like' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Discover similar titles based on author, genre, and reader ratings.'),
        ).toBeInTheDocument();
    });

    it('should render the heading and description for bestsellers mode', () => {
        render(
            <BooksCarousel
                books={mockBooks}
                mode="bestsellers"
            />,
        );

        expect(
            screen.getByRole('heading', { level: 2, name: 'Trending Bestsellers' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Discover the most popular titles currently capturing our readers' imaginations.",
            ),
        ).toBeInTheDocument();
    });

    it('should pass scroll states to RelatedBooksNavigationButtons', () => {
        mockedUseCarouselScroll.mockReturnValue({
            scrollContainerRef: { current: null },
            canScrollLeft: true,
            canScrollRight: false,
            handleScroll: jest.fn(),
        });

        render(
            <BooksCarousel
                books={mockBooks}
                mode="related_books"
            />,
        );

        expect(screen.getByTestId('can-scroll-left')).toHaveTextContent('true');
        expect(screen.getByTestId('can-scroll-right')).toHaveTextContent('false');
    });

    it('should render a BookCard for each book provided in props', () => {
        render(
            <BooksCarousel
                books={mockBooks}
                mode="related_books"
            />,
        );

        const cards = screen.getAllByTestId('book-card');
        expect(cards).toHaveLength(2);
        expect(screen.getByText('First Book')).toBeInTheDocument();
        expect(screen.getByText('Second Book')).toBeInTheDocument();
    });

    it('should call useCarouselScroll with the correct item count', () => {
        render(
            <BooksCarousel
                books={mockBooks}
                mode="related_books"
            />,
        );

        expect(mockedUseCarouselScroll).toHaveBeenCalledWith(2);
    });
});
