import { RestrictedAccessView } from '@/app/user/wishlist/shared/[username]/components/RestrictedAccessView';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/user/wishlist/shared/[username]/components/SharedWishlistHeader', () => ({
    SharedWishlistHeader: () => <header data-testid="mock-shared-header">Mock Header</header>,
}));

describe('RestrictedAccessView', () => {
    const mockUsername = 'testuser';

    it('renders the SharedWishlistHeader', () => {
        render(
            <RestrictedAccessView
                username={mockUsername}
                isPublicMode={true}
            />,
        );
        expect(screen.getByTestId('mock-shared-header')).toBeInTheDocument();
    });

    it('renders correctly in public mode', () => {
        render(
            <RestrictedAccessView
                username={mockUsername}
                isPublicMode={true}
            />,
        );

        expect(screen.getByText('Restricted Access')).toBeInTheDocument();
        expect(screen.getByText('Wishlist Unavailable')).toBeInTheDocument();

        expect(screen.getByText(/The public collection belonging to/i)).toBeInTheDocument();
        const userLink = screen.getByRole('link', { name: mockUsername });
        expect(userLink).toBeInTheDocument();
        expect(userLink).toHaveAttribute('href', `/user/${mockUsername}`);
        expect(
            screen.getByText(/cannot be accessed because it is currently set to private/i),
        ).toBeInTheDocument();
    });

    it('renders correctly in private mode', () => {
        render(
            <RestrictedAccessView
                username={mockUsername}
                isPublicMode={false}
            />,
        );

        expect(screen.getByText('Restricted Access')).toBeInTheDocument();
        expect(screen.getByText('Wishlist Unavailable')).toBeInTheDocument();

        expect(screen.getByText(/This private link for/i)).toBeInTheDocument();
        const userLink = screen.getByRole('link', { name: mockUsername });
        expect(userLink).toBeInTheDocument();
        expect(userLink).toHaveAttribute('href', `/user/${mockUsername}`);
        expect(screen.getByText(/is invalid, has been revoked\/reset/i)).toBeInTheDocument();
    });

    it('renders the return to store link', () => {
        render(
            <RestrictedAccessView
                username={mockUsername}
                isPublicMode={true}
            />,
        );

        const returnLink = screen.getByRole('link', { name: /Return to Store/i });
        expect(returnLink).toBeInTheDocument();
        expect(returnLink).toHaveAttribute('href', '/');
    });
});
