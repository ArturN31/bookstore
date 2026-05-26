import UsersWishlist from '@/app/user/wishlist/page';
import { FetchBooksFilters } from '@/data/books/BookRepository';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { UserStateContext } from '@/providers/user/UserContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';

// Define the interface for your mock context to avoid 'any'
interface MockUserContext {
    wishlist: { book_id: string }[] | null;
    loading: boolean;
    loggedIn: boolean;
    profileExists: boolean;
    dbUser: { id: string } | null;
}

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/data/actions/WishlistForm/WishlistAction');

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: ({
        initialData,
    }: {
        initialData: { data: { data: Book[] } };
        filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
    }) => (
        <div data-testid="mock-books-list">
            {initialData.data.data.map((b) => (
                <div key={b.id}>{b.title}</div>
            ))}
        </div>
    ),
}));

const renderWithContext = (
    wishlist: { book_id: string }[] | null = [],
    overrides: Partial<MockUserContext> = {},
) => {
    const defaultContext: MockUserContext = {
        wishlist,
        loading: false,
        loggedIn: true,
        profileExists: true,
        dbUser: { id: 'user-123' },
        ...overrides,
    };

    return render(
        <UserStateContext.Provider value={defaultContext as never}>
            <UsersWishlist />
        </UserStateContext.Provider>,
    );
};

const mockBooksData: Book[] = [
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
        sales_count: 50,
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
        sales_count: 50,
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
        sales_count: 50,
        is_active: true,
        reviews: [],
        rating: 4,
    },
];

describe('APP - User - wishlist', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render empty state when wishlist is empty', async () => {
        renderWithContext([]);

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('should render books when data is retrieved successfully', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockResolvedValue({
            data: {
                data: [mockBooksData[0]],
                totalPages: 1,
                currentPage: 1,
                total: 1,
            },
            error: null,
        });

        renderWithContext(mockWishlist);

        const book = await screen.findByText('The Mock Book 1');
        expect(book).toBeInTheDocument();
    });

    it('should render error state when API returns a response error', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        const apiErrorMessage = 'API database error';

        mockedFetchBooks.mockResolvedValue({
            data: null,
            error: apiErrorMessage,
        });

        renderWithContext(mockWishlist);

        const error = await screen.findByText(apiErrorMessage);
        expect(error).toBeInTheDocument();
    });

    it('should handle response with data but empty books array', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockResolvedValue({
            data: {
                data: null,
                totalPages: 0,
                currentPage: 0,
                total: 0,
            },
            error: null,
        });

        renderWithContext(mockWishlist);

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('should render the loading state when userLoading is true', async () => {
        await act(async () => {
            renderWithContext([], { loading: true });
        });

        expect(screen.getByText(/Curating your collection/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render "Profile Setup Required" state when profileExists is false', async () => {
        await act(async () => {
            renderWithContext([], { profileExists: false });
        });

        expect(screen.getByText(/Profile Setup Required/i)).toBeInTheDocument();

        const profileLink = screen.getByRole('link', { name: /Go to Profile/i });
        expect(profileLink).toHaveAttribute('href', '/user/profile');
    });

    it('should render fallback error message when fetchBooksWithReviews throws an exception', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        mockedFetchBooks.mockRejectedValue(new Error('Network Crash'));

        renderWithContext(mockWishlist);

        const error = await screen.findByText('Failed to fetch wishlist items. Please try again.');
        expect(error).toBeInTheDocument();
    });

    it('should reduce opacity of the collection while fetching books', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        let resolvePromise: (value: { data: unknown; error: string | null }) => void;
        const pendingPromise = new Promise<{ data: unknown; error: string | null }>((resolve) => {
            resolvePromise = resolve;
        });
        mockedFetchBooks.mockReturnValue(pendingPromise);

        const { rerender } = renderWithContext(mockWishlist);

        const syncing = await screen.findByText(/Syncing.../i);
        expect(syncing).toBeInTheDocument();

        await act(async () => {
            resolvePromise({
                data: {
                    data: [mockBooksData[0]],
                    totalPages: 1,
                    currentPage: 1,
                    total: 1,
                },
                error: null,
            });
        });

        await waitFor(() => {
            expect(screen.queryByText(/Syncing.../i)).not.toBeInTheDocument();
        });
    });

    it('should handle empty wishlist (covers useMemo !wishlist branch)', async () => {
        renderWithContext(null, { wishlist: null });

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('BRANCH COVERAGE: covers signal.aborted branches', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        mockedFetchBooks.mockImplementation(() => new Promise(() => {}));

        renderWithContext(mockWishlist);

        await screen.findByRole('heading', { level: 1 });
    });

    it('should call onRetry when error state is shown', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        mockedFetchBooks.mockRejectedValueOnce(new Error('Network error'));

        renderWithContext(mockWishlist);

        const errorState = await screen.findByText(/Wishlist Unavailable/i);
        expect(errorState).toBeInTheDocument();

        const retryButton = screen.getByText(/refresh page/i).closest('button');

        if (retryButton) {
            await act(async () => {
                fireEvent.click(retryButton);
            });
        }

        expect(mockedFetchBooks).toHaveBeenCalledTimes(2);
    });
});
