import { PublicProfileUnavailable } from '@/app/user/[username]/components/PublicProfileUnavailable';
import { render, screen } from '@testing-library/react';

describe('PublicProfileUnavailable', () => {
    it('should render the unavailable message, icon, and back to home link correctly', () => {
        render(<PublicProfileUnavailable />);

        expect(screen.getByText('Profile Unavailable')).toBeInTheDocument();
        expect(
            screen.getByText(
                'This user does not exist or has chosen to keep their profile private.',
            ),
        ).toBeInTheDocument();

        const homeLink = screen.getByRole('link', { name: /back to home/i });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute('href', '/');
    });
});
