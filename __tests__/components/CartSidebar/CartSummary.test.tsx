import { render, screen } from '@testing-library/react';
import { CartSummary } from '@/components/CartSidebar/CartSummary';
import { useCartState } from '@/providers/cart/utils/useCart';

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
}));

describe('APP - CartSidebar - Summary', () => {
    const mockUseCartState = jest.mocked(useCartState);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing when cartBooks is null', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: null,
            cartBooksAmount: 0,
            cartItemsAmount: 0,
            cartTotal: 0,
        } as any);

        const { container } = render(<CartSummary />);
        expect(container.firstChild).toBeNull();
    });

    it('should render correct summary data with valid cartTotal', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [{ id: '1' }],
            cartBooksAmount: 2,
            cartItemsAmount: 5,
            cartTotal: '45.99',
        } as any);

        render(<CartSummary />);

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('£45.99')).toBeInTheDocument();
    });

    it('should fall back to £0.00 when cartTotal is undefined (Coverage: Fallback)', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [{ id: '1' }],
            cartBooksAmount: 1,
            cartItemsAmount: 1,
            cartTotal: undefined,
        } as any);

        render(<CartSummary />);

        expect(screen.getByText('£0.00')).toBeInTheDocument();
    });

    it('should handle non-numeric cartTotal strings gracefully', () => {
        mockUseCartState.mockReturnValue({
            cartBooks: [{ id: '1' }],
            cartBooksAmount: 1,
            cartItemsAmount: 1,
            cartTotal: 'invalid_price',
        } as any);

        render(<CartSummary />);

        expect(screen.getByText('£0.00')).toBeInTheDocument();
    });
});
