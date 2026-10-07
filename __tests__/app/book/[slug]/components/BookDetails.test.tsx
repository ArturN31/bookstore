import { render, screen } from '@testing-library/react';
import { BookDetails } from '@/app/book/[slug]/components/BookDetails';
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

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn().mockResolvedValue({ data: [], error: null }),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const mockBook = createMockBook();

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
