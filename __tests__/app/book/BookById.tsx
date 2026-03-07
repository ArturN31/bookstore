import BookById, { generateMetadata } from '@/app/book/[slug]/page';
import { render, screen } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { notFound } from 'next/navigation';

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;
jest.mock('@/data/books/GetBooksData');

jest.mock('@/components/pages/book/BookMainDetails', () => ({
    BookMainDetails: () => <div data-testid="book-main-details" />,
}));

jest.mock('@/components/pages/book/BookCart', () => ({
    BookCart: () => <div data-testid="book-cart" />,
}));

jest.mock('@/components/pages/book/Reviews/BookReviews', () => ({
    BookReviews: () => <div data-testid="book-reviews" />,
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

const mockBookData: Book = {
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
    reviews: [
        {
            id: '1',
            created_at: new Date().getUTCDate().toString(),
            updated_at: new Date().getUTCDate().toString(),
            book_id: '1',
            user_id: '1',
            review: 'Great read',
            rating: 4,
            username: 'test',
        },
    ],
    rating: 5,
};

type BookByIdProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ reviewPagination?: string }>;
};

describe('App - Book[slug]', () => {
    const defaultProps: BookByIdProps = {
        params: Promise.resolve({ slug: mockBookData.id }),
        searchParams: Promise.resolve({}),
    };
    const mockParams = { params: Promise.resolve({ slug: 'mock-book-id-123' }) };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should render the book details when data is successfully fetched', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: [mockBookData],
            error: null,
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.getByText(mockBookData.description)).toBeInTheDocument();
        expect(screen.getByTestId('book-main-details')).toBeInTheDocument();
        expect(screen.getByTestId('book-cart')).toBeInTheDocument();
        expect(screen.getByTestId('book-reviews')).toBeInTheDocument();
    });

    it('Should render the error state when fetch fails', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: null,
            error: 'Database connection failed',
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.queryByTestId('book-main-details')).not.toBeInTheDocument();
    });

    it('should return correct metadata when book exists', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: [mockBookData],
            error: null,
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: `${mockBookData.title} by ${mockBookData.author} | Books4You`,
            description: mockBookData.description.substring(0, 160),
        });
    });

    it('should return fallback title when book is not found', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: [],
            error: null,
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: 'Book Not Found',
        });
    });

    it('Should trigger notFound when the books array is empty', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: [],
            error: null,
        });

        await expect(BookById(defaultProps)).rejects.toThrow('NEXT_NOT_FOUND');
        expect(notFound).toHaveBeenCalled();
    });

    it('Should fallback to an empty array when book has no reviews property', async () => {
        const bookWithNoReviews = { ...mockBookData, reviews: undefined };

        mockedFetchBooks.mockResolvedValue({
            data: [bookWithNoReviews],
            error: null,
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.getByTestId('book-reviews')).toBeInTheDocument();
    });
});
