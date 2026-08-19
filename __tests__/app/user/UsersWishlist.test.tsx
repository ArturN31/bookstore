import UsersWishlist from '@/app/user/wishlist/page';
import { BookQueryParams } from '@/data/books/BookRepository';
import { fetchBooksWithReviews } from '@/data/books/BookService';
import { UserStateContext } from '@/providers/user/UserContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';

interface MockUserContext {
    wishlist: { book_id: string }[] | null;
    loading: boolean;
    loggedIn: boolean;
    profileExists: boolean;
    dbUser: { id: string } | null;
}

const mockedFetchBooks = fetchBooksWithReviews as jest.Mock;

jest.mock('@/data/books/BookService', () => ({
    fetchBooksWithReviews: jest.fn(),
}));

jest.mock('@/data/user/wishlist/WishlistAction');

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: ({
        initialData,
        ...props
    }: {
        initialData: { data: { data: Book[] } };
        filters?: Omit<BookQueryParams, 'page' | 'limit'>;
        [key: string]: any;
    }) => (
        <section
            data-testid="mock-books-list"
            {...props}
        >
            {initialData.data.data.map((b) => (
                <div key={b.id}>{b.title}</div>
            ))}
        </section>
    ),
}));

const renderWithContext = (
    initialWishlist: { book_id: string }[] | null = [],
    initialOverrides: Partial<MockUserContext> = {},
) => {
    const Wrapper = ({
        wishlist,
        overrides,
    }: {
        wishlist: { book_id: string }[] | null;
        overrides: Partial<MockUserContext>;
    }) => {
        const defaultContext: MockUserContext = {
            wishlist,
            loading: false,
            loggedIn: true,
            profileExists: true,
            dbUser: { id: 'user-123' },
            ...overrides,
        };

        return (
            <UserStateContext.Provider
                value={defaultContext as unknown as React.ContextType<typeof UserStateContext>}
            >
                <UsersWishlist />
            </UserStateContext.Provider>
        );
    };

    const utils = render(
        <Wrapper
            wishlist={initialWishlist}
            overrides={initialOverrides}
        />,
    );

    return {
        ...utils,
        rerenderWithContext: (
            newWishlist: { book_id: string }[] | null,
            newOverrides: Partial<MockUserContext> = {},
        ) => {
            utils.rerender(
                <Wrapper
                    wishlist={newWishlist}
                    overrides={newOverrides}
                />,
            );
        },
    };
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
        mockedFetchBooks.mockImplementation(async (params: { bookIDs: string[] }) => {
            const ids = params?.bookIDs || [];
            const filteredBooks = mockBooksData.filter((b) => ids.includes(b.id));
            return {
                data: {
                    data: filteredBooks,
                    totalPages: 1,
                    currentPage: 1,
                    total: filteredBooks.length,
                },
                error: null,
            };
        });
    });

    it('should render empty state when wishlist is empty', async () => {
        renderWithContext([]);

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('should render books when data is retrieved successfully (covers line 41 signal.aborted false branch)', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        renderWithContext(mockWishlist);

        const book = await screen.findByText('The Mock Book 1');
        expect(book).toBeInTheDocument();
    });

    it('should render error state when API returns a response error', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        const apiErrorMessage = 'API database error';

        mockedFetchBooks.mockImplementation(async () => ({
            data: null,
            error: apiErrorMessage,
        }));

        renderWithContext(mockWishlist);

        const error = await screen.findByText(apiErrorMessage);
        expect(error).toBeInTheDocument();
    });

    it('should handle response with data but empty books array', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        mockedFetchBooks.mockImplementation(async () => ({
            data: {
                data: null,
                totalPages: 0,
                currentPage: 0,
                total: 0,
            },
            error: null,
        }));

        renderWithContext(mockWishlist);

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('should render the loading state when userLoading is true', async () => {
        let resolvePromise: (value: any) => void = () => {};
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        // Block the fetch so initialization stays false
        mockedFetchBooks.mockImplementation(() => pendingPromise);

        // Render directly without act block to capture the immediate loading state before effects finalize
        renderWithContext([{ book_id: 'mock-book-id-1' }], { loading: true });

        expect(screen.getByText(/Curating your collection/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        // Cleanup pending promise
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
    });

    it('should render "Profile Setup Required" state when profileExists is false', async () => {
        await act(async () => {
            renderWithContext([], { profileExists: false });
        });

        expect(screen.getByText(/Profile Setup Required/i)).toBeInTheDocument();

        const profileLink = screen.getByRole('link', { name: /Go to Profile/i });
        expect(profileLink).toHaveAttribute('href', '/user/profile');
    });

    it('should render fallback error message when fetchBooksWithReviews throws an exception (covers line 46 signal.aborted false branch)', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        mockedFetchBooks.mockImplementation(async () => {
            throw new Error('Network Crash');
        });

        renderWithContext(mockWishlist);

        const error = await screen.findByText('Failed to fetch wishlist items. Please try again.');
        expect(error).toBeInTheDocument();
    });

    it('should handle empty wishlist (covers useMemo !wishlist branch)', async () => {
        renderWithContext(null, { wishlist: null });

        const emptyMessage = await screen.findByText(/Your wishlist is empty/i);
        expect(emptyMessage).toBeInTheDocument();
    });

    it('should call onRetry when error state is shown', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];
        mockedFetchBooks.mockImplementation(async () => {
            throw new Error('Network error');
        });

        renderWithContext(mockWishlist);

        const errorState = await screen.findByText(
            'Failed to fetch wishlist items. Please try again.',
        );
        expect(errorState).toBeInTheDocument();

        const retryButton = screen.getByText(/refresh page/i).closest('button');

        mockedFetchBooks.mockClear();

        if (retryButton) {
            await act(async () => {
                fireEvent.click(retryButton);
            });
        }

        expect(mockedFetchBooks).toHaveBeenCalledTimes(1);
    });

    it('BRANCH COVERAGE: hits line 41 signal.aborted true condition block inside safe try scope', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        let resolveFormExecution: (value: unknown) => void = () => {};
        const pendingPromise = new Promise((resolve) => {
            resolveFormExecution = resolve;
        });

        mockedFetchBooks.mockImplementation(async () => pendingPromise);

        const { unmount } = renderWithContext(mockWishlist);

        await act(async () => {
            await Promise.resolve();
        });

        unmount();

        await act(async () => {
            resolveFormExecution({
                data: { data: [mockBooksData[0]] },
                error: null,
            });
        });
    });

    it('BRANCH COVERAGE: hits line 46 signal.aborted true condition block inside rejection catch scope', async () => {
        const mockWishlist = [{ book_id: 'mock-book-id-1' }];

        let rejectFormExecution: (reason: unknown) => void = () => {};
        const pendingPromise = new Promise((_, reject) => {
            rejectFormExecution = reject;
        });

        mockedFetchBooks.mockImplementation(async () => pendingPromise);

        const { unmount } = renderWithContext(mockWishlist);

        await act(async () => {
            await Promise.resolve();
        });

        unmount();

        await act(async () => {
            rejectFormExecution(new Error('Abort Error Catch Check'));
        });
    });
});
