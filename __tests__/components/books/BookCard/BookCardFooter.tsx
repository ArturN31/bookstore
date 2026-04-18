import { BookCardFooter } from '@/components/books/bookCard/BookCardFooter';
import { render, screen, fireEvent } from '@testing-library/react';

const mockedBook: Book = {
    id: 'mock-book-id-123',
    created_at: new Date().getUTCDate().toString(),
    updated_at: new Date().getUTCDate().toString(),
    title: 'The Mock Book',
    author: 'A. Test Author',
    genre: 'Fiction',
    publisher: 'Mock Publisher',
    publication_date: '2023-01-01',
    price: '19.99',
    description: 'A mock description.',
    format: 'Hardcover',
    page_count: 300,
    image_url: 'http://example.com/mock.jpg',
    stock_quantity: 10,
    is_active: true,
    reviews: [],
    rating: 5,
};

jest.mock('@/components/CartForms/CartActionForm', () => ({
    CartActionForm: ({ bookID, stock }: { bookID: string; stock: number }) => (
        <div data-testid="mock-cart-action-form" data-book-id={bookID} data-stock={stock} />
    ),
}));

describe('APP - BookCard - Footer', () => {
    it('should render format and cart action form', () => {
        render(<BookCardFooter book={mockedBook} />);

        expect(screen.getByText('Hardcover')).toBeInTheDocument();
        expect(screen.getByTestId('mock-cart-action-form')).toBeInTheDocument();
        expect(screen.getByTestId('mock-cart-action-form')).toHaveAttribute('data-book-id', 'mock-book-id-123');
        expect(screen.getByTestId('mock-cart-action-form')).toHaveAttribute('data-stock', '10');
    });

    it('should render with different format', () => {
        const paperbackBook = { ...mockedBook, format: 'Paperback' };
        
        render(<BookCardFooter book={paperbackBook} />);

        expect(screen.getByText('Paperback')).toBeInTheDocument();
    });

    it('should call stopPropagation on click event (covers line 14 onClick handler)', () => {
        render(<BookCardFooter book={mockedBook} />);

        const wrapper = screen.getByTestId('mock-cart-action-form').parentElement;
        expect(wrapper).toBeInTheDocument();
        
        // Create a click event and verify stopPropagation is available
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        
        // Track if stopPropagation was called
        let stopPropagationCalled = false;
        const originalStopPropagation = clickEvent.stopPropagation.bind(clickEvent);
        clickEvent.stopPropagation = () => {
            stopPropagationCalled = true;
            originalStopPropagation();
        };
        
        if (wrapper) {
            wrapper.dispatchEvent(clickEvent);
            expect(stopPropagationCalled).toBe(true);
        }
    });
});
