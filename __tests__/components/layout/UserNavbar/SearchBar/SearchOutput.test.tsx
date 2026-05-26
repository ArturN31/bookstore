import { render, screen, fireEvent } from '@testing-library/react';
import { SearchOutput } from '@/components/layout/UserNavbar/SearchBar/SearchOutput';

const mockRouterPush = jest.fn();
const mockOnClose = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

const mockBooks: Book[] = [
    {
        id: 'mock-book-id-1',
        created_at: new Date().getUTCDate().toString(),
        updated_at: new Date().getUTCDate().toString(),
        title: 'The Mock Book 1',
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
    },
    {
        id: 'mock-book-id-2',
        created_at: new Date().getUTCDate().toString(),
        updated_at: new Date().getUTCDate().toString(),
        title: 'The Mock Book 2',
        author: 'B. Test Author',
        genre: 'Thriller',
        publisher: 'Mock Publisher',
        publication_date: '2022-01-01',
        price: '14.99',
        description: 'A mock description.',
        format: 'Hardcover',
        page_count: 400,
        image_url: 'http://example.com/mock.jpg',
        stock_quantity: 30,
        is_active: true,
        reviews: [],
        rating: 3,
    },
    {
        id: 'mock-book-id-3',
        created_at: new Date().getUTCDate().toString(),
        updated_at: new Date().getUTCDate().toString(),
        title: 'The Mock Book 3',
        author: 'C. Test Author',
        genre: 'Novel',
        publisher: 'Mock Publisher',
        publication_date: '2021-01-01',
        price: '12.99',
        description: 'A mock description.',
        format: 'Hardcover',
        page_count: 500,
        image_url: 'http://example.com/mock.jpg',
        stock_quantity: 30,
        is_active: true,
        reviews: [],
        rating: 4,
    },
];

describe('layout - UserNavbar - SearchBar - SearchOutput', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should render the error message when errorMessage prop is provided', () => {
        const testError = 'Failed to load books.';
        render(
            <SearchOutput
                books={[]}
                errorMessage={testError}
                onClose={mockOnClose}
                activeIndex={0}
                isLoading={false}
            />,
        );

        const errorOutput = screen.getByTestId('searchbar-searchoutput-error');
        expect(errorOutput).toBeInTheDocument();
        expect(errorOutput).toHaveClass('border-red-500');
        expect(errorOutput).toHaveTextContent(testError);
    });

    it('Should render the loading state when isLoading is true', () => {
        render(
            <SearchOutput
                books={[]}
                errorMessage={null}
                onClose={mockOnClose}
                activeIndex={0}
                isLoading={true}
            />,
        );

        expect(screen.getByText(/Searching.../i)).toBeInTheDocument();

        const resultsOutput = screen.getByTestId('searchbar-searchoutput');
        expect(resultsOutput.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('Should render "No books found" message when books array is empty and not loading', () => {
        render(
            <SearchOutput
                books={[]}
                errorMessage={null}
                onClose={mockOnClose}
                activeIndex={0}
                isLoading={false}
            />,
        );

        const emptyOutput = screen.getByTestId('searchbar-searchoutput');
        expect(emptyOutput).toHaveTextContent('No books found.');
    });

    it('Should render the list of books when the books array is not empty', () => {
        render(
            <SearchOutput
                books={mockBooks}
                errorMessage={null}
                onClose={mockOnClose}
                activeIndex={0}
                isLoading={false}
            />,
        );

        const resultsOutput = screen.getByTestId('searchbar-searchoutput');
        expect(resultsOutput).toBeInTheDocument();
        expect(screen.getByText(mockBooks[0].title)).toBeInTheDocument();
    });

    it('Should apply active class to the book at the activeIndex', () => {
        render(
            <SearchOutput
                books={mockBooks}
                errorMessage={null}
                onClose={mockOnClose}
                activeIndex={1}
                isLoading={false}
            />,
        );

        const buttons = screen.getAllByRole('option');
        expect(buttons[1]).toHaveClass('bg-slate-200');
        expect(buttons[0]).not.toHaveClass('bg-slate-200');
    });

    it('Should call router.push and onClose when a book is clicked', () => {
        render(
            <SearchOutput
                books={mockBooks}
                errorMessage={null}
                onClose={mockOnClose}
                activeIndex={0}
                isLoading={false}
            />,
        );

        const bookButton = screen.getByText(mockBooks[0].title);
        fireEvent.click(bookButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockRouterPush).toHaveBeenCalledWith(`/book/${mockBooks[0].id}`);
    });
});
