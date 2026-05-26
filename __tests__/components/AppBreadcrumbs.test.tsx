import { AppBreadcrumbs } from '@/components/ui/AppBreadcrumbs';
import { render, screen } from '@testing-library/react';

describe('AppBreadcrumbs', () => {
    const mockItems = [
        { label: 'Home', href: '/' },
        { label: 'Books', href: '/books' },
        { label: 'Fantasy', href: '/books/fantasy', active: true, count: 42 },
    ];

    it('should render all breadcrumb labels', () => {
        render(<AppBreadcrumbs items={mockItems} />);

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Books')).toBeInTheDocument();
        expect(screen.getByText('Fantasy')).toBeInTheDocument();
    });

    it('should render non-active items as links with correct hrefs', () => {
        render(<AppBreadcrumbs items={mockItems} />);

        const homeLink = screen.getByRole('link', { name: /home/i });
        const booksLink = screen.getByRole('link', { name: /books/i });

        expect(homeLink).toHaveAttribute('href', '/');
        expect(booksLink).toHaveAttribute('href', '/books');
    });

    it('should render the active item without a link and with the correct count', () => {
        render(<AppBreadcrumbs items={mockItems} />);

        const activeLabel = screen.getByText('Fantasy');
        expect(activeLabel.closest('a')).toBeNull();

        expect(screen.getByText('(42)')).toBeInTheDocument();
    });

    it('should not render parentheses if count is undefined', () => {
        const itemsNoCount = [
            { label: 'Home', href: '/' },
            { label: 'Current', href: '#', active: true },
        ];
        render(<AppBreadcrumbs items={itemsNoCount} />);

        expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it('should render the separator icon', () => {
        const { container } = render(<AppBreadcrumbs items={mockItems} />);

        const separator = container.querySelector('svg[data-testid="KeyboardArrowRightIcon"]');
        expect(separator).toBeInTheDocument();
    });
});
