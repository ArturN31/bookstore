import { CartSidebar } from '@/components/CartSidebar/CartSidebar';
import { useCartState } from '@/providers/cart/utils/useCart';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));
jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
}));
jest.mock('@/components/CartSidebar/CartItem/CartItem', () => ({
    CartItem: ({ book }: any) => <div data-testid="cart-item">{book.title}</div>,
}));
jest.mock('@/components/CartSidebar/CartHeader', () => ({
    CartHeader: ({ handleCloseCart }: any) => (
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
        mockUseRouter.mockReturnValue({ push: mockPush } as any);
    });

    it('should show empty state when cartBooks is null or empty', () => {
        mockUseCartState.mockReturnValue({ cartBooks: null } as any);
        const { rerender } = render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );
        expect(screen.getByText(/your cart is currently empty/i)).toBeInTheDocument();

        mockUseCartState.mockReturnValue({ cartBooks: [] } as any);
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
        mockUseCartState.mockReturnValue({ cartBooks: mockBooks } as any);

        const { container } = render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        const items = screen.getAllByTestId('cart-item');
        expect(items).toHaveLength(2);

        const separators = container.querySelectorAll('hr');
        expect(separators).toHaveLength(1);
    });

    it('should call setOpenCart(false) via handleCloseCart', () => {
        mockUseCartState.mockReturnValue({ cartBooks: [] } as any);
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
        mockUseCartState.mockReturnValue({ cartBooks: [{ id: '1' }] } as any);
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
        mockUseCartState.mockReturnValue({ cartBooks: mockBooks } as any);

        render(
            <CartSidebar
                openCart={true}
                setOpenCart={mockSetOpenCart}
            />,
        );

        expect(screen.getByTestId('cart-item')).toHaveTextContent('Book No ID');
    });
});
