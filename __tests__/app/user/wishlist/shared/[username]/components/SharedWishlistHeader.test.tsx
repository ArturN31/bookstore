import { SharedWishlistHeader } from '@/app/user/wishlist/shared/[username]/components/SharedWishlistHeader';
import { render, screen } from '@testing-library/react';

describe('SharedWishlistHeader', () => {
    it('renders "Public Showcase" when isPublicMode is true by default', () => {
        render(<SharedWishlistHeader />);

        expect(screen.getByText('Public Showcase')).toBeInTheDocument();
        expect(screen.queryByText('Secure Private Share')).not.toBeInTheDocument();
    });

    it('renders "Public Showcase" when isPublicMode is explicitly true', () => {
        render(<SharedWishlistHeader isPublicMode={true} />);

        expect(screen.getByText('Public Showcase')).toBeInTheDocument();
    });

    it('renders "Secure Private Share" when isPublicMode is false', () => {
        render(<SharedWishlistHeader isPublicMode={false} />);

        expect(screen.getByText('Secure Private Share')).toBeInTheDocument();
        expect(screen.queryByText('Public Showcase')).not.toBeInTheDocument();
    });

    it('renders a working link to return to the store', () => {
        render(<SharedWishlistHeader />);

        const returnLink = screen.getByRole('link', { name: /Back to Store/i });
        expect(returnLink).toBeInTheDocument();
        expect(returnLink).toHaveAttribute('href', '/');
    });
});
