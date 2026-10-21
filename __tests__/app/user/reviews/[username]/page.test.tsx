import { render, screen } from '@testing-library/react';
import UserReviewsPage from '@/app/user/reviews/[username]/page';
import { getPublicProfile } from '@/data/user/profile/PrivacySettingsService';
import { checkIsOwner } from '@/utils/auth/checkOwnership';
import { createBackendClient } from '@/utils/db/server';
import { verifyRateLimit } from '@/utils/network/rateLimiter';

jest.mock('@/data/user/profile/PrivacySettingsService', () => ({
    getPublicProfile: jest.fn(),
}));

jest.mock('@/utils/auth/checkOwnership', () => ({
    checkIsOwner: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/app/user/reviews/components/UserReviewsInteractive', () => ({
    UserReviewsInteractive: () => <div data-testid="user-reviews-interactive" />,
}));

jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));

jest.mock('@/utils/network/rateLimiter', () => ({
    limiters: { search: {} },
    verifyRateLimit: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

describe('UserReviewsPage privacy', () => {
    const mockGetPublicProfile = getPublicProfile as jest.MockedFunction<typeof getPublicProfile>;
    const mockCheckIsOwner = checkIsOwner as jest.MockedFunction<typeof checkIsOwner>;
    const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
        typeof createBackendClient
    >;
    const mockVerifyRateLimit = verifyRateLimit as jest.Mock;
    const mockRange = jest.fn();
    let mockSelect: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckIsOwner.mockResolvedValue(false);
        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 30,
            remaining: 29,
            reset: Date.now() + 60000,
        });
        mockRange.mockResolvedValue({ data: [], error: null });

        const query = {
            select: jest.fn(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: mockRange,
        };
        mockSelect = query.select;
        query.select.mockReturnValue(query);
        mockCreateBackendClient.mockResolvedValue({
            from: jest.fn().mockReturnValue(query),
        } as unknown as Awaited<ReturnType<typeof createBackendClient>>);
    });

    it('does not query or return reviews when the user has disabled public reviews', async () => {
        mockGetPublicProfile.mockResolvedValue({
            data: {
                id: 'user-1',
                username: 'reader',
                created_at: '2026-01-01',
                is_profile_public: true,
                is_wishlist_public: true,
                are_reviews_public: false,
            },
            error: null,
        });

        await expect(
            UserReviewsPage({ params: Promise.resolve({ username: 'reader' }) }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(mockRange).not.toHaveBeenCalled();
    });

    it('allows public reviews independently of profile visibility and excludes user IDs', async () => {
        mockGetPublicProfile.mockResolvedValue({
            data: {
                id: 'user-1',
                username: 'reader',
                created_at: '2026-01-01',
                is_profile_public: false,
                is_wishlist_public: false,
                are_reviews_public: true,
            },
            error: null,
        });

        const page = await UserReviewsPage({
            params: Promise.resolve({ username: 'reader' }),
        });
        render(page);

        expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        expect(mockRange).toHaveBeenCalledWith(0, 5);
        expect(mockSelect.mock.calls[0][0]).not.toContain('user_id');
    });
});
