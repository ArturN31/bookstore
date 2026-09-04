import { render, screen } from '@testing-library/react';
import { getPublicUserProfile } from '@/data/user/UserService';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import PublicProfilePage from '@/app/user/[username]/page';

jest.mock('@/data/user/UserService', () => ({
    getPublicUserProfile: jest.fn(),
}));

jest.mock('@/app/user/[username]/components/PublicProfileUnavailable', () => ({
    PublicProfileUnavailable: () => <div data-testid="public-profile-unavailable">Unavailable</div>,
}));

jest.mock('@/app/user/[username]/components/PublicProfileBanner', () => ({
    PublicProfileBanner: ({ profile }: { profile: { username: string } }) => (
        <div data-testid="public-profile-banner">Banner for {profile.username}</div>
    ),
}));

describe('PublicProfilePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render PublicProfileUnavailable when profile is not found error occurs', async () => {
        (getPublicUserProfile as jest.Mock).mockResolvedValue({
            data: null,
            error: APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND,
        });

        const params = Promise.resolve({ username: 'nonexistent' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-unavailable')).toBeInTheDocument();
        expect(getPublicUserProfile).toHaveBeenCalledWith('nonexistent');
    });

    it('should render PublicProfileUnavailable when profile data is null without error', async () => {
        (getPublicUserProfile as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });

        const params = Promise.resolve({ username: 'emptyuser' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-unavailable')).toBeInTheDocument();
        expect(getPublicUserProfile).toHaveBeenCalledWith('emptyuser');
    });

    it('should render error banner when a general error occurs', async () => {
        (getPublicUserProfile as jest.Mock).mockResolvedValue({
            data: null,
            error: 'Database connection failed',
        });

        const params = Promise.resolve({ username: 'johndoe' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
        expect(getPublicUserProfile).toHaveBeenCalledWith('johndoe');
    });

    it('should render PublicProfileBanner when profile is successfully fetched', async () => {
        const mockProfile = { username: 'johndoe', created_at: '2026-01-01T00:00:00.000Z' };
        (getPublicUserProfile as jest.Mock).mockResolvedValue({
            data: mockProfile,
            error: null,
        });

        const params = Promise.resolve({ username: 'johndoe' });
        const ui = await PublicProfilePage({ params });
        render(ui);

        expect(screen.getByTestId('public-profile-banner')).toBeInTheDocument();
        expect(screen.getByText('Banner for johndoe')).toBeInTheDocument();
        expect(getPublicUserProfile).toHaveBeenCalledWith('johndoe');
    });
});
