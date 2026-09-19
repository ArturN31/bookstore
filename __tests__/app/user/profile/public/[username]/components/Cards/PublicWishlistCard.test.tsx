import { PublicWishlistCard } from '@/app/user/profile/public/[username]/components/Cards/PublicWishlistCard';
import { render, screen } from '@testing-library/react';

jest.mock(
    '@/app/user/profile/public/[username]/components/ProfileCard/ProfileCardContainer',
    () => ({
        ProfileCardContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="profile-card-container">{children}</div>
        ),
    }),
);

jest.mock('@/app/user/profile/public/[username]/components/ProfileCard/ProfileCardHeader', () => ({
    ProfileCardHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
        <div data-testid="profile-card-header">
            <span>{title}</span>
            <span>{subtitle}</span>
        </div>
    ),
}));

jest.mock(
    '@/app/user/profile/public/[username]/components/ProfileCard/ProfileCardActionButton',
    () => ({
        ProfileCardActionButton: ({
            href,
            children,
        }: {
            href: string;
            children: React.ReactNode;
        }) => (
            <a
                href={href}
                data-testid="profile-card-action-button"
            >
                {children}
            </a>
        ),
    }),
);

describe('PublicWishlistCard', () => {
    const mockUsername = 'janedoe';

    it('renders the wishlist card structure and contents correctly when public', () => {
        render(<PublicWishlistCard username={mockUsername} />);

        expect(screen.getByTestId('profile-card-container')).toBeInTheDocument();
        expect(screen.getByTestId('profile-card-header')).toBeInTheDocument();
        expect(screen.getByText('Public Wishlist')).toBeInTheDocument();
        expect(screen.getByText('Book recommendations & saved items')).toBeInTheDocument();

        expect(
            screen.getByText(
                new RegExp(
                    `Explore books and reading lists that @${mockUsername} has chosen to share`,
                    'i',
                ),
            ),
        ).toBeInTheDocument();

        const actionButton = screen.getByTestId('profile-card-action-button');
        expect(actionButton).toBeInTheDocument();
        expect(actionButton).toHaveAttribute('href', `/user/wishlist/${mockUsername}`);
        expect(screen.getByText('View Wishlist')).toBeInTheDocument();
    });

    it('renders "Wishlist" as the title when isPublic is false', () => {
        render(
            <PublicWishlistCard
                username={mockUsername}
                isPublic={false}
            />,
        );

        expect(screen.getByText('Wishlist')).toBeInTheDocument();
        expect(screen.queryByText('Public Wishlist')).not.toBeInTheDocument();
    });
});
