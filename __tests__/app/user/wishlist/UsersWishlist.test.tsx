import UsersWishlist from '@/app/user/wishlist/page';
import { BookQueryParams } from '@/data/books/BookRepository';
import { fetchBooksWithReviews } from '@/data/books/BookService';
import { UserStateContext } from '@/providers/user/UserContext';
import { createMockBooksArray } from '@/utils/testing/mockBook';
import { fireEvent, render, screen } from '@testing-library/react';
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

jest.mock('@/data/user/wishlist/sharing/WishlistShareAction', () => ({
    updateWishlistVisibilityAction: jest.fn(),
}));

jest.mock('@/components/books/BooksManager', () => ({
    BooksManager: ({
        initialData,
        ...props
    }: {
        initialData: { data: { data: Book[] } };
        filters?: Omit<BookQueryParams, 'page' | 'limit'>;
        [key: string]: unknown;
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

const mockBooksData = createMockBooksArray(3);

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
        let resolvePromise: (value: unknown) => void = () => {};
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        mockedFetchBooks.mockImplementation(() => pendingPromise);

        renderWithContext([{ book_id: 'mock-book-id-1' }], { loading: true });

        expect(screen.getByText(/Curating your collection/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

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
