import { CartSidebar } from '@/components/CartSidebar/CartSidebar';
import { useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

const mockUseSyncExternalStore = jest.fn();

jest.mock('react', () => {
    const actualReact = jest.requireActual('react');
    return {
        ...actualReact,
        useSyncExternalStore: (...args: Parameters<typeof actualReact.useSyncExternalStore>) =>
            mockUseSyncExternalStore(...args),
    };
});

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(() => ({
        refreshCart: jest.fn(),
    })),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        user: { id: 'user-1' },
        loggedIn: true,
        profileExists: true,
    })),
}));

jest.mock('@/data/cart/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('@/components/CartSidebar/CartItem/CartItem', () => ({
    CartItem: ({ book }: { book: { id?: string; title: string } }) => (
        <div data-testid="cart-item">{book.title}</div>
    ),
}));

jest.mock('@/components/CartSidebar/CartHeader', () => ({
    CartHeader: ({ handleCloseCart }: { handleCloseCart: () => void }) => (
        <button onClick={handleCloseCart}>Close Header</button>
    ),
}));

jest.mock('@/components/CartSidebar/CartSummary', () => ({
    CartSummary: () => <div>Summary</div>,
}));

describe('APP - CartSidebar', () => {
    const mockPush = jest.fn();
    const mockSetOpenCart = jest.fn();
    const mockUseRouter = jest.mocked(useRouter);
    const mockUseCartState = jest.mocked(useCartState);

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>);
        const actualReact = jest.requireActual('react');
        mockUseSyncExternalStore.mockImplementation((...args) =>
            actualReact.useSyncExternalStore(...args),
        );
    });

    it('should return null when not mounted', () => {
        mockUseSyncExternalStore.mockReturnValue(false);
        mockUseCartState.mockReturnValue({
            cartBooks: [],
        } as unknown as ReturnType<typeof useCartState>);

        const { container } = render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('should show empty state when cartBooks is null or empty', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: null,
        } as unknown as ReturnType<typeof useCartState>);
        const { rerender } = render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );
        expect(screen.getByText(/your cart is currently empty/i)).toBeInTheDocument();

        mockUseCartState.mockReturnValue({
            cartBooks: [],
        } as unknown as ReturnType<typeof useCartState>);
        rerender(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );
        expect(screen.getByText(/your cart is currently empty/i)).toBeInTheDocument();
    });

    it('should render a list of items and separators when cart has books', () => {
        const mockBooks = [
            { id: '1', title: 'Book 1' },
            { id: '2', title: 'Book 2' },
        ];
        mockUseCartState.mockReturnValue({
            cartBooks: mockBooks,
        } as unknown as ReturnType<typeof useCartState>);

        render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        const items = screen.getAllByTestId('cart-item');
        expect(items).toHaveLength(2);

        const separators = document.body.querySelectorAll('hr');
        expect(separators).toHaveLength(1);
    });

    it('should call setOpenCart(false) via handleCloseCart', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [],
        } as unknown as ReturnType<typeof useCartState>);
        render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        fireEvent.click(screen.getByText('Close Header'));
        expect(mockSetOpenCart).toHaveBeenCalledWith(false);
    });

    it('should navigate to checkout when proceed button is clicked', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [{ id: '1' }],
        } as unknown as ReturnType<typeof useCartState>);
        render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }));
        expect(mockPush).toHaveBeenCalledWith('/checkout');
    });

    it('should use fallback key when book id is missing', () => {
        const mockBooks = [{ title: 'Book No ID' }];
        mockUseCartState.mockReturnValue({
            cartBooks: mockBooks,
        } as unknown as ReturnType<typeof useCartState>);

        render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        expect(screen.getByTestId('cart-item')).toHaveTextContent('Book No ID');
    });
});
