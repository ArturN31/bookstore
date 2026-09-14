import { PublicProfileBanner } from '@/app/user/profile/public/[username]/components/PublicProfileBanner';
import { render, screen } from '@testing-library/react';

describe('PublicProfileBanner', () => {
    it('should render username, capitalized initial, and formatted joined date correctly', () => {
        const mockProfile = {
            username: 'johndoe',
            created_at: '2026-01-01T00:00:00.000Z',
        };

        render(
            <PublicProfileBanner
                profile={mockProfile}
                mode="public"
            />,
        );

        expect(screen.getByText('@johndoe')).toBeInTheDocument();
        expect(screen.getByText('J')).toBeInTheDocument();
        expect(screen.getByText('Joined January 2026')).toBeInTheDocument();
        expect(screen.getByText('Public Profile')).toBeInTheDocument();
    });

    it('should render Private Profile when mode is private', () => {
        const mockProfile = {
            username: 'johndoe',
            created_at: '2026-01-01T00:00:00.000Z',
        };

        render(
            <PublicProfileBanner
                profile={mockProfile}
                mode="private"
            />,
        );

        expect(screen.getByText('Private Profile')).toBeInTheDocument();
    });
});
