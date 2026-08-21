import { SharedWishlistHero } from '@/app/user/wishlist/shared/[username]/components/SharedWishlistHero';
import { render, screen } from '@testing-library/react';

describe('SharedWishlistHero', () => {
    const mockUsername = 'testuser';

    describe('Public Mode', () => {
        it('renders correct text and an active link to the public profile', () => {
            render(
                <SharedWishlistHero
                    username={mockUsername}
                    totalBooks={5}
                    isPublicMode={true}
                />,
            );

            expect(screen.getByText('Curator Public Wishlist')).toBeInTheDocument();
            expect(screen.getByText('Reading List Showcase')).toBeInTheDocument();
            expect(
                screen.getByText(/A public selection of titles handpicked by/i),
            ).toBeInTheDocument();

            const userProfileLink = screen.getByRole('link', { name: `@${mockUsername}` });
            expect(userProfileLink).toBeInTheDocument();
            expect(userProfileLink).toHaveAttribute('href', `/user/profile/public/${mockUsername}`);
        });
    });

    describe('Private Mode', () => {
        it('renders correct text and no link for the username', () => {
            render(
                <SharedWishlistHero
                    username={mockUsername}
                    totalBooks={5}
                    isPublicMode={false}
                />,
            );

            expect(screen.getByText('Curator Secure Share')).toBeInTheDocument();
            expect(screen.getByText('Reading List Showcase')).toBeInTheDocument();
            expect(
                screen.getByText(/A private shared reading list curated via secure link by/i),
            ).toBeInTheDocument();

            expect(
                screen.queryByRole('link', { name: `@${mockUsername}` }),
            ).not.toBeInTheDocument();

            expect(screen.getByText(`@${mockUsername}`)).toBeInTheDocument();
        });
    });

    describe('Pluralization Logic', () => {
        it('renders singular "Volume" when totalBooks is 1', () => {
            render(
                <SharedWishlistHero
                    username={mockUsername}
                    totalBooks={1}
                    isPublicMode={true}
                />,
            );

            expect(screen.getByText('Total Saved')).toBeInTheDocument();
            expect(screen.getByText('1 Volume')).toBeInTheDocument();
        });

        it('renders plural "Volumes" when totalBooks is 0', () => {
            render(
                <SharedWishlistHero
                    username={mockUsername}
                    totalBooks={0}
                    isPublicMode={true}
                />,
            );

            expect(screen.getByText('0 Volumes')).toBeInTheDocument();
        });

        it('renders plural "Volumes" when totalBooks is greater than 1', () => {
            render(
                <SharedWishlistHero
                    username={mockUsername}
                    totalBooks={42}
                    isPublicMode={true}
                />,
            );

            expect(screen.getByText('42 Volumes')).toBeInTheDocument();
        });
    });
});
