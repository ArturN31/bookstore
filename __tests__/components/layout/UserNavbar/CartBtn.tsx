import { useCartState } from '@/providers/cart/utils/useCart';
import { CartBtn } from '@/components/layout/UserNavbar/CartBtn';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

jest.mock('@/providers/cart/utils/useCart');

describe('layout - UserNavbar', () => {
    beforeEach(() => {
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
            cartBooksAmount: 11,
            cartItemsAmount: 0,
            cartTotal: '0',
            cartID: null,
            loading: false,
            cartError: null,
            refreshCart: jest.fn(),
        });
    });

    it('Should update state on click', () => {
        render(<CartBtn />);

        const cartButton = screen.getByTestId('cart-button');
        fireEvent.click(cartButton);
    });
});
