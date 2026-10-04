import { render, screen } from '@testing-library/react';
import { BookHeader } from '@/app/book/[slug]/components/Header/BookHeader';
import { createMockBook } from '@/utils/testing/mockBook';

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
    const mockBook = createMockBook({ title: 'Test Book Title' });

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
