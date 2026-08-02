import { render, screen } from '@testing-library/react';
import { fetchBooksWithReviews } from '@/data/books/BookService';
import BookById, { generateMetadata } from '@/app/book/[slug]/page';

interface BookByIdProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ reviewPagination?: string }>;
}

jest.mock('next/cache', () => ({
    unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => fn,
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;
jest.mock('@/data/books/BookService', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        user: { id: '1', name: 'Test User' },
        isAuthenticated: true,
        loggedIn: true,
        profileExists: true,
    })),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(() => ({
        cartBooks: [],
        addItem: jest.fn(),
        removeItem: jest.fn(),
    })),
    useCartActions: jest.fn(() => ({
        refreshCart: jest.fn(),
        addToCart: jest.fn(),
        removeFromCart: jest.fn(),
    })),
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    })),
    usePathname: jest.fn(() => '/book/mock-book-id-123'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock child components to isolate BookById server page rendering from deep client hooks/contexts
jest.mock('@/components/pages/book/Header/BookHeader', () => ({
    BookHeader: ({ book }: { book: { title: string; author: string } }) => (
        <div>
            <h1>{book.title}</h1>
            <p>{book.author}</p>
        </div>
    ),
}));

jest.mock('@/components/pages/book/BookDetails', () => ({
    BookDetails: () => <div data-testid="book-details" />,
}));

jest.mock('@/components/pages/book/Reviews/BookReviews', () => ({
    BookReviews: () => <div data-testid="book-reviews" />,
}));

const mockBookData = {
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
    sales_count: null,
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
            error: null,
            data: {
                data: [mockBookData],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.getAllByText('The Mock Book')[0]).toBeInTheDocument();
        expect(screen.getByText('A. Test Author')).toBeInTheDocument();
    });

    it('Should process explicit reviewPagination tracking route parameters (covers lines 48-52)', async () => {
        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [mockBookData],
                totalPages: 5,
                currentPage: 2,
                total: 25,
            },
        });

        const explicitProps: BookByIdProps = {
            params: Promise.resolve({ slug: mockBookData.id }),
            searchParams: Promise.resolve({ reviewPagination: '2' }),
        };

        const element = await BookById(explicitProps);
        render(element);
        expect(screen.getAllByText('The Mock Book')[0]).toBeInTheDocument();
    });

    it('Should render the error state when fetch fails', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: null,
            error: 'Database connection failed',
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.queryByText('The Mock Book')).not.toBeInTheDocument();
    });

    it('should return correct metadata when book exists', async () => {
        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [mockBookData],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: `${mockBookData.title} by ${mockBookData.author} | Books4You`,
            description: (mockBookData.description as string).substring(0, 160),
        });
    });

    it('should return metadata with default description when book description is empty (covers ?? branch)', async () => {
        const bookWithEmptyDescription = { ...mockBookData, description: '' };

        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [bookWithEmptyDescription],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: `${bookWithEmptyDescription.title} by ${bookWithEmptyDescription.author} | Books4You`,
            description: 'Book details.',
        });
    });

    it('should return metadata with default description when book description is null (covers ?? branch)', async () => {
        const bookWithNullDescription = {
            ...mockBookData,
            description: null as unknown as string,
        };

        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [bookWithNullDescription],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: `${bookWithNullDescription.title} by ${bookWithNullDescription.author} | Books4You`,
            description: 'Book details.',
        });
    });

    it('should return fallback title when book is not found', async () => {
        mockedFetchBooks.mockResolvedValue({
            data: null,
            error: 'Book not found',
        });

        const metadata = await generateMetadata(mockParams);

        expect(metadata).toEqual({
            title: 'Book Not Found',
        });
    });

    it('Should trigger notFound when the books array is empty', async () => {
        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [],
                totalPages: 0,
                currentPage: 1,
                total: 0,
            },
        });

        await expect(BookById(defaultProps)).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('Should fallback to an empty array and fallback totals when properties are missing (covers lines 58-62 branch)', async () => {
        const bookWithNoReviews = { ...mockBookData, reviews: undefined };

        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [bookWithNoReviews],
                totalPages: 0,
                total: 0,
            },
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.getAllByText('The Mock Book')[0]).toBeInTheDocument();
    });

    it('Should cover fallback values for total and totalPages when they are undefined (covers missing coverage branches)', async () => {
        mockedFetchBooks.mockResolvedValue({
            error: null,
            data: {
                data: [mockBookData],
            },
        });

        const element = await BookById(defaultProps);
        render(element);

        expect(screen.getAllByText('The Mock Book')[0]).toBeInTheDocument();
    });
});
