import { render, screen } from '@testing-library/react';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import PublicProfilePage from '@/app/user/profile/public/[username]/page';
import {
    getPublicProfile,
    getUserPrivacySettings,
} from '@/data/user/profile/PrivacySettingsService';
import { checkIsOwner } from '@/utils/auth/checkOwnership';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

jest.mock('@/data/user/profile/PrivacySettingsService', () => ({
    getPublicProfile: jest.fn(),
    getUserPrivacySettings: jest.fn(),
}));

jest.mock('@/utils/auth/checkOwnership', () => ({
    checkIsOwner: jest.fn(),
}));

jest.mock('@/app/user/profile/public/[username]/components/PublicProfileUnavailable', () => ({
    PublicProfileUnavailable: () => <div data-testid="public-profile-unavailable">Unavailable</div>,
}));

jest.mock('@/app/user/profile/public/[username]/components/PublicProfileBanner', () => ({
    PublicProfileBanner: ({ profile }: { profile: { username: string } }) => (
        <div data-testid="public-profile-banner">Banner for {profile.username}</div>
    ),
}));

jest.mock('@/app/user/profile/public/[username]/components/Cards/PublicWishlistCard', () => ({
    PublicWishlistCard: ({ username }: { username: string }) => (
        <div data-testid="public-wishlist-card">Wishlist for {username}</div>
    ),
}));

jest.mock('@/app/user/profile/public/[username]/components/Cards/ReadingActivityCard', () => ({
    ReadingActivityCard: () => <div data-testid="reading-activity-card">Reading Activity</div>,
}));

jest.mock(
    '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsControl',
    () => ({
        PrivacySettingsControl: () => (
            <div data-testid="privacy-settings-control">Privacy Settings Control</div>
        ),
    }),
);

describe('PublicProfilePage', () => {
    const mockGetPublicProfile = getPublicProfile as jest.MockedFunction<typeof getPublicProfile>;
    const mockGetUserPrivacySettings = getUserPrivacySettings as jest.MockedFunction<
        typeof getUserPrivacySettings
    >;
    const mockCheckIsOwner = checkIsOwner as jest.MockedFunction<typeof checkIsOwner>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCheckIsOwner.mockResolvedValue(false);
    });

    it('should render PublicProfileUnavailable when profile is not found error occurs', async () => {
        mockGetPublicProfile.mockResolvedValue({
            data: null,
            error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND,
        });

        const params = Promise.resolve({ username: 'nonexistent' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-unavailable')).toBeInTheDocument();
        expect(mockGetPublicProfile).toHaveBeenCalledWith('nonexistent');
    });

    it('should render PublicProfileUnavailable when profile data is null without error', async () => {
        mockGetPublicProfile.mockResolvedValue({
            data: null,
            error: null,
        });

        const params = Promise.resolve({ username: 'emptyuser' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-unavailable')).toBeInTheDocument();
        expect(mockGetPublicProfile).toHaveBeenCalledWith('emptyuser');
    });

    it('should render error banner when a general error occurs', async () => {
        mockGetPublicProfile.mockResolvedValue({
            data: null,
            error: 'Database connection failed',
        });

        const params = Promise.resolve({ username: 'johndoe' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(mockGetPublicProfile).toHaveBeenCalledWith('johndoe');
    });

    it('should render profile banner, reading activity card, and hide public wishlist card when wishlist is not public', async () => {
        const mockProfile = {
            id: 'user-123',
            username: 'johndoe',
            created_at: '2026-01-01T00:00:00.000Z',
            is_profile_public: true,
            is_wishlist_public: false,
            are_reviews_public: true,
        };
        mockGetPublicProfile.mockResolvedValue({
            data: mockProfile,
            error: null,
        });

        const params = Promise.resolve({ username: 'johndoe' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-banner')).toBeInTheDocument();
        expect(screen.getByText('Banner for johndoe')).toBeInTheDocument();
        expect(screen.getByTestId('reading-activity-card')).toBeInTheDocument();
        expect(screen.queryByTestId('public-wishlist-card')).not.toBeInTheDocument();
        expect(mockGetPublicProfile).toHaveBeenCalledWith('johndoe');
    });

    it('should render profile banner, reading activity card, and public wishlist card when wishlist is public', async () => {
        const mockProfile = {
            id: 'user-123',
            username: 'johndoe',
            created_at: '2026-01-01T00:00:00.000Z',
            is_profile_public: true,
            is_wishlist_public: true,
            are_reviews_public: true,
        };
        mockGetPublicProfile.mockResolvedValue({
            data: mockProfile,
            error: null,
        });

        const params = Promise.resolve({ username: 'johndoe' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-banner')).toBeInTheDocument();
        expect(screen.getByTestId('reading-activity-card')).toBeInTheDocument();
        expect(screen.getByTestId('public-wishlist-card')).toBeInTheDocument();
        expect(screen.getByText('Wishlist for johndoe')).toBeInTheDocument();
        expect(mockGetPublicProfile).toHaveBeenCalledWith('johndoe');
    });
});
