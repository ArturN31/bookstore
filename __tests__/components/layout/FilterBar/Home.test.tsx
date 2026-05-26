import { Home } from '@/components/layout/FilterBar/Home';
import { fireEvent, render, screen } from '@testing-library/react';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
    usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
    const MockLink = ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode;
        href: string;
    }) => (
        <a
            href={href}
            {...props}
        >
            {children}
        </a>
    );

    MockLink.displayName = 'MockLink';

    return MockLink;
});

describe('FilterBar - Home', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePathname.mockReturnValue('/some-other-page');
    });

    it('Should render the component as a link with "Home" text', () => {
        render(<Home />);

        const homeElement = screen.getByRole('link', { name: /home/i });

        expect(homeElement).toBeInTheDocument();
        expect(homeElement).toHaveAttribute('href', '/');
        expect(homeElement).not.toHaveAttribute('aria-current', 'page');
    });

    it('Should correctly apply the active state when on the homepage', () => {
        mockUsePathname.mockReturnValue('/');

        render(<Home />);

        const homeElement = screen.getByRole('link', { name: /home/i });
        expect(homeElement).toHaveAttribute('aria-current', 'page');
        expect(homeElement).toHaveClass('text-blue-600');
    });

    it('Should be navigable to the homepage when clicked', async () => {
        render(<Home />);

        const homeElement = screen.getByRole('link', { name: /home/i });
        expect(homeElement).toHaveAttribute('href', '/');

        fireEvent.click(homeElement);
    });
});
