import { render, screen } from '@testing-library/react';
import { BookHeaderDetails } from '@/app/book/[slug]/components/Header/BookHeaderDetails';
import { createMockBook } from '@/utils/testing/mockBook';

describe('BookHeaderDetails Component', () => {
    // Only override what the low-stock test needs; the rest uses global defaults
    const mockBook = createMockBook({ stock_quantity: 15 });

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

        expect(screen.getByText('Default Book Title')).toBeInTheDocument();

        const authorLink = screen.getByRole('link', { name: 'Default Author' });
        expect(authorLink).toHaveAttribute('href', '/books/author/Default%20Author');

        expect(screen.getByText('2024-01-01')).toBeInTheDocument();

        const publisherLink = screen.getByRole('link', { name: 'Default Publisher' });
        expect(publisherLink).toHaveAttribute('href', '/books/publisher/Default%20Publisher');

        const formatLink = screen.getByRole('link', { name: 'Paperback' });
        expect(formatLink).toHaveAttribute('href', '/books/format/Paperback');

        const genreLink = screen.getByRole('link', { name: 'Fiction' });
        expect(genreLink).toHaveAttribute('href', '/books/genre/Fiction');
    });
});
