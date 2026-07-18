import { BookHeaderDetails } from '@/components/pages/book/Header/BookHeaderDetails';
import { screen, render } from '@testing-library/react';

describe('APP - pages/book - BookMainDetails', () => {
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
        stock_quantity: 30,
        sales_count: 100,
        is_active: true,
        reviews: [],
        rating: 5,
    };

    it('should render component with correct details', () => {
        render(<BookHeaderDetails book={mockedBook} />);

        expect(screen.getByText(mockedBook.title)).toBeInTheDocument();
        expect(screen.getByText(/Published:/i)).toBeInTheDocument();
        expect(screen.getByText(mockedBook.publication_date)).toBeInTheDocument();
        expect(screen.getByText(mockedBook.publisher)).toBeInTheDocument();
    });
});
