import { BookDetails } from '@/components/pages/book/BookDetails';
import { render, screen } from '@testing-library/react';

const mockBook: Book = {
    id: 'book-1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    description:
        'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
    publisher: 'Prentice Hall',
    publication_date: '2008-08-01',
    format: 'Paperback',
    page_count: 464,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    genre: 'Technology',
    image_url: '/images/clean-code.jpg',
    is_active: true,
    price: '29.99',
    sales_count: 1500,
    stock_quantity: 100,
};

describe('BookDetails', () => {
    it('renders the description section correctly', () => {
        render(<BookDetails book={mockBook} />);

        const descriptionHeading = screen.getByRole('heading', { name: 'Description', level: 2 });
        expect(descriptionHeading).toBeInTheDocument();

        const descriptionText = screen.getByText(mockBook.description);
        expect(descriptionText).toBeInTheDocument();
        expect(descriptionText).toHaveClass('text-justify', 'leading-relaxed');
    });

    it('renders the technical details table with correct labels and values', () => {
        render(<BookDetails book={mockBook} />);

        const techDetailsHeading = screen.getByRole('heading', {
            name: 'Technical Details',
            level: 2,
        });
        expect(techDetailsHeading).toBeInTheDocument();

        const expectedDetails = [
            { label: 'Title:', value: mockBook.title },
            { label: 'Author:', value: mockBook.author },
            { label: 'Publisher:', value: mockBook.publisher },
            { label: 'Publication date:', value: mockBook.publication_date },
            { label: 'Page count:', value: mockBook.page_count.toString() },
            { label: 'Format:', value: mockBook.format },
        ];

        expectedDetails.forEach(({ label, value }) => {
            const rowHeader = screen.getByRole('rowheader', { name: label });
            expect(rowHeader).toBeInTheDocument();

            const tableRow = rowHeader.closest('tr');
            expect(tableRow).toBeInTheDocument();

            if (tableRow) {
                expect(tableRow).toHaveTextContent(value);
            }
        });
    });

    it('renders the horizontal divider with correct accessibility attributes', () => {
        const { container } = render(<BookDetails book={mockBook} />);

        const hrElement = container.querySelector('hr');

        expect(hrElement).toBeInTheDocument();
        expect(hrElement).toHaveAttribute('aria-hidden', 'true');
        expect(hrElement).toHaveClass('border-gray-200');
    });
});
