import { useCartState } from '@/providers/cart/utils/useCart';
import { Header } from '@/components/layout/Header';
import { render, screen, fireEvent } from '@testing-library/react';

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
    MockLink.displayName = 'MockNextLink';
    return MockLink;
});

jest.mock('@/providers/cart/utils/useCart');

jest.mock('@/components/layout/UserNavbar/UserNavbar', () => ({
    UserNavbar: () => <div data-testid="mock-user-navbar" />,
}));

jest.mock('@/components/layout/FilterBar/FilterBar', () => ({
    FilterBar: () => <div data-testid="mock-filter-bar" />,
}));

describe('Header and Scroll Behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
            cartBooksAmount: 0,
            cartItemsAmount: 0,
            cartTotal: '0',
            cartID: null,
            loading: false,
            cartError: null,
            refreshCart: jest.fn(),
        });
        Object.defineProperty(window, 'scrollY', {
            value: 0,
            writable: true,
        });
    });

    it('Should render component', () => {
        render(<Header />);

        const headerElement = screen.getByTestId('header');
        expect(headerElement).toBeInTheDocument();
    });

    it('should keep header visible when scrolling within top threshold (currentScrollY <= 50)', () => {
        render(<Header />);

        Object.defineProperty(window, 'scrollY', { value: 30, writable: true });
        fireEvent.scroll(window);

        const headerElement = screen.getByTestId('header').closest('header');
        expect(headerElement).toHaveClass('translate-y-0');
    });

    it('should hide header when scrolling down past threshold (currentScrollY > lastScrollY && currentScrollY > 100)', () => {
        render(<Header />);

        Object.defineProperty(window, 'scrollY', { value: 60, writable: true });
        fireEvent.scroll(window);

        Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
        fireEvent.scroll(window);

        const headerElement = screen.getByTestId('header').closest('header');
        expect(headerElement).toHaveClass('-translate-y-full');
    });

    it('should show header immediately when scrolling up (currentScrollY < lastScrollY)', () => {
        render(<Header />);

        Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
        fireEvent.scroll(window);
        Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
        fireEvent.scroll(window);

        const headerElement = screen.getByTestId('header').closest('header');
        expect(headerElement).toHaveClass('-translate-y-full');

        Object.defineProperty(window, 'scrollY', { value: 120, writable: true });
        fireEvent.scroll(window);

        expect(headerElement).toHaveClass('translate-y-0');
    });

    it('should remove scroll event listener on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
        const { unmount } = render(<Header />);

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
        removeEventListenerSpy.mockRestore();
    });
});
