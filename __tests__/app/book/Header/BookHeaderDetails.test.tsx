import { render, screen } from '@testing-library/react';
import { BookHeaderDetails } from '@/app/book/[slug]/components/Header/BookHeaderDetails';

describe('BookHeaderDetails Component', () => {
    const mockBook: Book = {
        id: '1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Advanced Testing',
        author: 'John Doe',
        genre: 'Education',
        publisher: 'Tech Books',
        publication_date: '2024-05-10',
        price: '19.99',
        description: 'A mock description.',
        format: 'Paperback',
        page_count: 300,
        image_url: 'https://example.com/image.jpg',
        stock_quantity: 15,
        is_active: true,
        reviews: [],
        rating: 5,
        sales_count: null,
    };

    it('should render low stock badge when stock quantity is between 1 and 25', () => {
        render(<BookHeaderDetails book={mockBook} />);

        const badge = screen.getByText('15 left');
        expect(badge).toBeInTheDocument();
    });

    it('should not render low stock badge when stock quantity is greater than 25', () => {
        const highStockBook: Book = { ...mockBook, stock_quantity: 40 };
        render(<BookHeaderDetails book={highStockBook} />);

        const badge = screen.queryByText(/left/i);
        expect(badge).not.toBeInTheDocument();
    });

    it('should not render low stock badge when stock quantity is 0', () => {
        const zeroStockBook: Book = { ...mockBook, stock_quantity: 0 };
        render(<BookHeaderDetails book={zeroStockBook} />);

        const badge = screen.queryByText(/left/i);
        expect(badge).not.toBeInTheDocument();
    });

    it('should render all book metadata accurately with proper links', () => {
        render(<BookHeaderDetails book={mockBook} />);

        expect(screen.getByText('Advanced Testing')).toBeInTheDocument();

        const authorLink = screen.getByRole('link', { name: 'John Doe' });
        expect(authorLink).toHaveAttribute('href', '/books/author/John%20Doe');

        expect(screen.getByText('2024-05-10')).toBeInTheDocument();

        const publisherLink = screen.getByRole('link', { name: 'Tech Books' });
        expect(publisherLink).toHaveAttribute('href', '/books/publisher/Tech%20Books');

        const formatLink = screen.getByRole('link', { name: 'Paperback' });
        expect(formatLink).toHaveAttribute('href', '/books/format/Paperback');

        const genreLink = screen.getByRole('link', { name: 'Education' });
        expect(genreLink).toHaveAttribute('href', '/books/genre/Education');
    });
});
