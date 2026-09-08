import { ReadingActivityCard } from '@/app/user/[username]/components/Cards/ReadingActivityCard';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/user/[username]/components//ProfileCard/ProfileCardContainer', () => ({
    ProfileCardContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="profile-card-container">{children}</div>
    ),
}));

jest.mock('@/app/user/[username]/components//ProfileCard/ProfileCardHeader', () => ({
    ProfileCardHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
        <div data-testid="profile-card-header">
            <span>{title}</span>
            <span>{subtitle}</span>
        </div>
    ),
}));

describe('ReadingActivityCard', () => {
    it('renders the reading activity card structure and contents correctly', () => {
        render(<ReadingActivityCard />);

        expect(screen.getByTestId('profile-card-container')).toBeInTheDocument();
        expect(screen.getByTestId('profile-card-header')).toBeInTheDocument();
        expect(screen.getByText('Reading Activity')).toBeInTheDocument();
        expect(screen.getByText('Public stats and reviews')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Check out recent reviews, ratings, and literary milestones achieved by this reader.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
});
