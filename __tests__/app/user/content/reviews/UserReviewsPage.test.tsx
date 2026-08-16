import { render, screen } from '@testing-library/react';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import UserReviewsPage from '@/app/user/content/reviews/page';
import { UserReviewsInteractive } from '@/app/user/content/reviews/components/UserReviewsInteractive';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(),
}));

jest.mock('@/app/user/content/reviews/components/UserReviewsInteractive', () => ({
    UserReviewsInteractive: jest.fn(() => <div data-testid="user-reviews-interactive" />),
}));

jest.mock('@mui/icons-material/ArrowBack', () => ({
    __esModule: true,
    default: () => <span data-testid="arrow-back-icon" />,
}));

jest.mock('@mui/icons-material/RateReviewOutlined', () => ({
    __esModule: true,
    default: () => <span data-testid="rate-review-icon" />,
}));

describe('UserReviewsPage', () => {
    const mockGetUser = jest.fn<
        Promise<{
            data: { user: { id: string } | null };
            error: { message: string } | null;
        }>,
        []
    >();
    const mockFrom = jest.fn();
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockOrder = jest.fn();
    const mockRange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockRange.mockResolvedValue({
            data: [],
            error: null,
        });
        mockOrder.mockReturnValue({ range: mockRange });
        mockEq.mockReturnValue({ order: mockOrder });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockFrom.mockReturnValue({ select: mockSelect });

        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue({
            auth: {
                getUser: mockGetUser,
            },
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createBackendClient>>);

        const mockedSafeQuery = safeSupabaseQuery as unknown as jest.Mock<
            Promise<{ data: unknown; error: Error | null }>
        >;
        mockedSafeQuery.mockImplementation(async (queryFn) => {
            const queryData = await queryFn();
            return { data: queryData.data, error: queryData.error };
        });
    });

    it('should render sign-in message when userError is present', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(screen.getByText('Please sign in to view your reviews.')).toBeInTheDocument();
    });

    it('should render sign-in message when user is null', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(screen.getByText('Please sign in to view your reviews.')).toBeInTheDocument();
    });

    it('should render error message when safeSupabaseQuery returns an error', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        const mockedSafeQuery = safeSupabaseQuery as unknown as jest.Mock<
            Promise<{ data: unknown; error: Error | null }>
        >;
        mockedSafeQuery.mockResolvedValue({
            data: null,
            error: new Error('Database query failed'),
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(
            screen.getByText('Failed to load reviews. Please try again later.'),
        ).toBeInTheDocument();
    });

    it('should render empty state when user has no reviews', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        const mockedSafeQuery = safeSupabaseQuery as unknown as jest.Mock<
            Promise<{ data: unknown; error: Error | null }>
        >;
        mockedSafeQuery.mockResolvedValue({
            data: [],
            error: null,
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        expect(screen.getByText(/You haven't written any book reviews yet/i)).toBeInTheDocument();
    });

    it('should render UserReviewsInteractive with reviews, single object book, and nullish coalescing when books is null', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        const mockReviews = [
            {
                id: 1,
                book_id: 10,
                user_id: 'user-123',
                username: 'testuser',
                rating: 5,
                review: 'Great book!',
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
                books: { id: 10, title: 'Book Title', author: 'Author Name' },
            },
            {
                id: 2,
                book_id: 11,
                user_id: 'user-123',
                username: 'testuser',
                rating: 4,
                review: 'Good book!',
                created_at: '2026-01-02T00:00:00.000Z',
                updated_at: '2026-01-02T00:00:00.000Z',
                books: null,
            },
        ];

        mockRange.mockResolvedValue({
            data: mockReviews,
            error: null,
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(screen.getByTestId('user-reviews-interactive')).toBeInTheDocument();
        expect(UserReviewsInteractive).toHaveBeenCalled();
        const calledProps = (UserReviewsInteractive as jest.Mock).mock.calls[0][0];
        expect(calledProps.initialHasMore).toBe(false);
        expect(calledProps.initialReviews).toHaveLength(2);
        expect(calledProps.initialBooksMap).toEqual({
            1: { id: 10, title: 'Book Title', author: 'Author Name' },
            2: null,
        });
        expect(mockFrom).toHaveBeenCalledWith('book_reviews');
        expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockRange).toHaveBeenCalledWith(0, 5);
    });

    it('should handle pagination check (initialHasMore = true) when rawReviews length > PAGE_SIZE with array books', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        const mockReviews = Array.from({ length: 6 }, (_value, index) => ({
            id: index + 1,
            book_id: 100 + index,
            user_id: 'user-123',
            username: 'testuser',
            rating: 4,
            review: `Review ${index + 1}`,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            books: [{ id: 100 + index, title: `Book ${index + 1}`, author: 'Author' }],
        }));

        mockRange.mockResolvedValue({
            data: mockReviews,
            error: null,
        });

        const ui = await UserReviewsPage();
        render(ui);

        expect(UserReviewsInteractive).toHaveBeenCalled();
        const calledProps = (UserReviewsInteractive as jest.Mock).mock.calls[0][0];
        expect(calledProps.initialHasMore).toBe(true);
        expect(calledProps.initialReviews).toHaveLength(5);
        expect(calledProps.initialBooksMap[1]).toEqual({
            id: 100,
            title: 'Book 1',
            author: 'Author',
        });
    });
});
