import { EmptyWishlistView } from '@/app/user/wishlist/shared/[username]/components/EmptyWishlistView';
import { render, screen } from '@testing-library/react';

describe('EmptyWishlistView', () => {
    const mockUsername = 'testuser';

    it('renders the public mode state correctly', () => {
        render(
            <EmptyWishlistView
                username={mockUsername}
                isPublicMode={true}
            />,
        );

        expect(screen.getByText('Public Wishlist')).toBeInTheDocument();
        expect(screen.getByText('Wishlist is Empty')).toBeInTheDocument();

        expect(screen.getByText(/The public reading list belonging to/i)).toBeInTheDocument();
        expect(screen.getByText(`@${mockUsername}`)).toBeInTheDocument();
        expect(screen.getByText(/does not contain any books yet/i)).toBeInTheDocument();
    });

    it('renders the private shared collection state correctly', () => {
        render(
            <EmptyWishlistView
                username={mockUsername}
                isPublicMode={false}
            />,
        );

        expect(screen.getByText('Shared Collection')).toBeInTheDocument();
        expect(screen.getByText('Wishlist is Empty')).toBeInTheDocument();

        expect(
            screen.getByText(/This private shared collection belonging to/i),
        ).toBeInTheDocument();
        expect(screen.getByText(`@${mockUsername}`)).toBeInTheDocument();
        expect(screen.getByText(/does not have any books added at this time/i)).toBeInTheDocument();
    });

    it('renders a working link to return to the store', () => {
        render(
            <EmptyWishlistView
                username={mockUsername}
                isPublicMode={true}
            />,
        );

        const returnLink = screen.getByRole('link', { name: /Return to Store/i });
        expect(returnLink).toBeInTheDocument();
        expect(returnLink).toHaveAttribute('href', '/');
    });
});
