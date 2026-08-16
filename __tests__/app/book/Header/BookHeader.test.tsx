import { render, screen } from '@testing-library/react';
import { BookHeader } from '@/app/book/[slug]/components/Header/BookHeader';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    BookAdvancedFilteringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/data/advancedFiltering/FilteringConstants', () => ({
    DEFAULT_FILTERING_CONSTANTS: {
        categories: [],
        tags: [],
    },
    getFilteringConstants: jest.fn().mockResolvedValue({
        categories: [],
        tags: [],
    }),
}));

jest.mock('@/app/book/[slug]/components/Header/BookHeaderDetails', () => ({
    BookHeaderDetails: ({ book }: { book: Book }) => (
        <div data-testid="book-header-details">{book.title}</div>
    ),
}));

jest.mock('@/app/book/[slug]/components/Header/BookCart', () => ({
    BookCart: () => <div data-testid="book-cart" />,
}));

describe('BookHeader Component', () => {
    const mockBook: Book = {
        id: '1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Test Book Title',
        author: 'Test Author',
        genre: 'Fiction',
        publisher: 'Test Publisher',
        publication_date: '2023-01-01',
        price: '19.99',
        description: 'A mock description.',
        format: 'Hardcover',
        page_count: 300,
        image_url: 'https://example.com/image.jpg',
        stock_quantity: 10,
        is_active: true,
        reviews: [],
        rating: 5,
        sales_count: null,
    };

    it('should render the book cover image with correct alt text and src', () => {
        render(<BookHeader book={mockBook} />);

        const image = screen.getByAltText('Cover for Test Book Title');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', expect.stringContaining('example.com'));
    });

    it('should fallback to placeholder image when image_url is missing', () => {
        const bookWithoutImage: Book = { ...mockBook, image_url: '' };
        render(<BookHeader book={bookWithoutImage} />);

        const image = screen.getByAltText('Cover for Test Book Title');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', expect.stringContaining('/placeholder-book.svg'));
    });

    it('should render child components correctly', () => {
        render(<BookHeader book={mockBook} />);

        expect(screen.getByTestId('book-header-details')).toBeInTheDocument();
        expect(screen.getByTestId('book-cart')).toBeInTheDocument();
    });
});
