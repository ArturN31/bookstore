import { render, screen } from '@testing-library/react';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import UserReviewsPage from '@/app/user/reviews/[username]/page';
import { UserReviewsInteractive } from '@/app/user/reviews/components/UserReviewsInteractive';
import { getPublicProfile } from '@/data/user/profile/PrivacySettingsService';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('@/data/user/profile/PrivacySettingsService', () => ({
    getPublicProfile: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(),
}));

jest.mock('@/app/user/reviews/components/UserReviewsInteractive', () => ({
    UserReviewsInteractive: jest.fn(() => <div data-testid="user-reviews-interactive" />),
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
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
    const mockGetPublicProfile = jest.mocked(getPublicProfile);
    const mockVerifyRateLimit = jest.mocked(verifyRateLimit);
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
    const mockSingle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetPublicProfile.mockResolvedValue({
            data: {
                id: 'user-123',
                username: 'testuser',
                created_at: '2026-01-01T00:00:00.000Z',
                is_wishlist_public: false,
                are_reviews_public: true,
                is_profile_public: true,
            },
            error: null,
        });
        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 60,
            remaining: 59,
            reset: Date.now() + 60000,
        });

        mockSingle.mockResolvedValue({
            data: { username: 'testuser' },
            error: null,
        });

        mockRange.mockResolvedValue({
            data: [],
            error: null,
        });
        mockOrder.mockReturnValue({ range: mockRange });
        mockEq.mockReturnValue({
            order: mockOrder,
            single: mockSingle,
        });
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

    it('rate limits public review reads before accessing the database', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            limit: 60,
            remaining: 0,
            reset: Date.now() + 60000,
        });

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
        render(ui);

        expect(screen.getByText('Please Try Again Later')).toBeInTheDocument();
        expect(
            screen.getByText('Too many review requests. Please try again later.'),
        ).toBeInTheDocument();
        expect(createBackendClient).not.toHaveBeenCalled();
        expect(mockVerifyRateLimit).toHaveBeenCalledWith(
            expect.objectContaining({
                identifier: 'ip:203.0.113.1',
                failClosed: true,
            }),
        );
    });

    it('should render reviews page successfully when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
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
        ];

        mockRange.mockResolvedValue({
            data: mockReviews,
            error: null,
        });

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
        render(ui);

        expect(screen.getByText("testuser's Book Reviews")).toBeInTheDocument();
        expect(screen.getByTestId('user-reviews-interactive')).toBeInTheDocument();
        expect(UserReviewsInteractive).toHaveBeenCalled();
        const calledProps = (UserReviewsInteractive as jest.Mock).mock.calls[0][0];
        expect(calledProps.isOwner).toBe(false);
    });

    it('should pass isOwner as true when logged-in user matches profile username', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        mockSingle.mockResolvedValue({
            data: { username: 'testuser' },
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
        ];

        mockRange.mockResolvedValue({
            data: mockReviews,
            error: null,
        });

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
        render(ui);

        expect(screen.getByText("testuser's Book Reviews")).toBeInTheDocument();
        expect(screen.getByTestId('user-reviews-interactive')).toBeInTheDocument();
        expect(UserReviewsInteractive).toHaveBeenCalled();
        const calledProps = (UserReviewsInteractive as jest.Mock).mock.calls[0][0];
        expect(calledProps.isOwner).toBe(true);
    });

    it('should set isOwner to false when user is authenticated but profileData is null', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });

        mockSingle.mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
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
        ];

        mockRange.mockResolvedValue({
            data: mockReviews,
            error: null,
        });

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
        render(ui);

        expect(screen.getByTestId('user-reviews-interactive')).toBeInTheDocument();
        const calledProps = (UserReviewsInteractive as jest.Mock).mock.calls[0][0];
        expect(calledProps.isOwner).toBe(false);
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

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
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

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
        render(ui);

        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        expect(
            screen.getByText("This user hasn't written any book reviews yet."),
        ).toBeInTheDocument();
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

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
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
        expect(mockEq).toHaveBeenCalledWith('username', 'testuser');
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

        const ui = await UserReviewsPage({ params: Promise.resolve({ username: 'testuser' }) });
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
