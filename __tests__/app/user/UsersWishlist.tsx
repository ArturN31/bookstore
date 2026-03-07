import UsersWishlist from '@/app/user/wishlist/page';
import {
    FetchBooksFilters,
    FetchBooksResponse,
    fetchBooksWithReviews,
} from '@/data/books/GetBooksData';
import { UserStateContext } from '@/providers/user/UserContext';
import { act, render, screen, waitFor } from '@testing-library/react';

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;

jest.mock('@/data/books/GetBooksData', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/data/actions/WishlistForm/WishlistAction');

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: ({
        initialData,
        filters,
    }: {
        initialData: FetchBooksResponse;
        filters?: Omit<FetchBooksFilters, 'page' | 'limit'>;
    }) => (
        <div data-testid="mock-books-list">
            {initialData.data.map((b) => (
                <div key={b.id}>{b.title}</div>
            ))}
        </div>
    ),
}));

const renderWithContext = (wishlist: any[], overrides = {}) => {
    const defaultContext = {
        wishlist,
        loading: false,
        loggedIn: true,
        profileExists: true,
        dbUser: { id: 'user-123' },
    };

    return render(
        <UserStateContext.Provider value={{ ...defaultContext, ...overrides } as any}>
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

describe('APP - User - wishlist', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render empty state when wishlist is empty', async () => {
        renderWithContext([]);
        expect(screen.getByText(/Your wishlist is empty/i)).toBeInTheDocument();
    });

    it('should render books when data is retrieved successfully', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockResolvedValue({
            data: [mockBooksData[0]],
            error: null,
        });

        renderWithContext(mockWishlist);

        await waitFor(() => {
            expect(screen.getByText('The Mock Book 1')).toBeInTheDocument();
        });
    });

    it('should render error state when API returns a response error', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        const apiErrorMessage = 'API database error';

        mockedFetchBooks.mockResolvedValue({
            data: null,
            error: apiErrorMessage,
        });

        renderWithContext(mockWishlist);

        await waitFor(() => {
            expect(screen.getByText(apiErrorMessage)).toBeInTheDocument();
        });
    });

    it('should render the loading state when userLoading is true', () => {
        renderWithContext([], { loading: true });

        expect(screen.getByText(/Curating your collection/i)).toBeInTheDocument();
        expect(screen.getByText(/Loading your saved preferences/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render "Profile Setup Required" state when profileExists is false', () => {
        renderWithContext([], { profileExists: false });

        expect(screen.getByText(/Profile Setup Required/i)).toBeInTheDocument();
        expect(screen.getByText(/We need your address details/i)).toBeInTheDocument();

        const profileLink = screen.getByRole('link', { name: /Go to Profile/i });
        expect(profileLink).toHaveAttribute('href', '/user/profile');
    });

    it('should render fallback error message when fetchBooksWithReviews throws an exception', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockRejectedValue(new Error('Network Crash'));

        renderWithContext(mockWishlist);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch wishlist items.')).toBeInTheDocument();
        });
    });

    it('should reduce opacity of the collection while fetching books', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockResolvedValueOnce({
            data: [mockBooksData[0]],
            error: null,
        });

        const { rerender } = renderWithContext(mockWishlist);

        await waitFor(() => {
            expect(screen.getByLabelText('Wishlist collection')).toBeInTheDocument();
        });

        let resolvePromise: any;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        mockedFetchBooks.mockReturnValue(pendingPromise);

        rerender(
            <UserStateContext.Provider
                value={
                    {
                        wishlist: [...mockWishlist],
                        loading: false,
                        loggedIn: true,
                        profileExists: true,
                        dbUser: { id: 'user-123' },
                    } as any
                }
            >
                <UsersWishlist />
            </UserStateContext.Provider>,
        );

        const wishlistSection = screen.getByLabelText('Wishlist collection');

        await waitFor(() => {
            expect(wishlistSection).toHaveStyle('opacity: 0.7');
        });

        expect(screen.getByText(/Syncing library.../i)).toBeInTheDocument();

        await act(async () => {
            resolvePromise({ data: [mockBooksData[0]], error: null });
        });

        await waitFor(() => {
            expect(wishlistSection).toHaveStyle('opacity: 1');
        });
    });
});
