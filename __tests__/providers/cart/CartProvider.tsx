import { render, screen, waitFor, act } from '@testing-library/react';
import { CartProvider } from '@/providers/cart/CartProvider';
import { useCartState, useCartActions } from '@/providers/cart/utils/useCart';

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({ user: null, loggedIn: false })),
}));

jest.mock('@/utils/db/client', () => ({
    createFrontendClient: jest.fn(() => ({
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel'),
        removeChannel: jest.fn(),
    })),
}));

jest.mock('@/data/cart/GetCartData', () => ({
    getCartData: jest.fn().mockResolvedValue({ data: null, error: null }),
}));

jest.mock('@/providers/cart/utils/useCartListeners', () => ({
    useCartListeners: jest.fn(),
}));

const TestConsumer = () => {
    const { cartID, loading } = useCartState();
    const { refreshCart } = useCartActions();
    return (
        <div>
            <span data-testid="cart-id">{cartID || 'none'}</span>
            <span data-testid="loading">{loading ? 'yes' : 'no'}</span>
            <button data-testid="refresh-btn" onClick={() => refreshCart()}>Refresh</button>
        </div>
    );
};

describe('CartProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should provide cart state context', () => {
        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        expect(screen.getByTestId('cart-id')).toHaveTextContent('none');
    });

    it('should initialize with initialCart when provided', () => {
        const initialCart = {
            cartID: 'cart-123',
            cartBooks: [],
            cartBooksAmount: 0,
            cartItemsAmount: 0,
            cartTotal: 0,
            loading: false,
        };

        render(
            <CartProvider initialCart={initialCart}>
                <TestConsumer />
            </CartProvider>
        );

        expect(screen.getByTestId('cart-id')).toHaveTextContent('cart-123');
    });

    it('should initialize with null cart when initialCart is null', () => {
        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        expect(screen.getByTestId('cart-id')).toHaveTextContent('none');
    });

    it('should set loading to false initially', () => {
        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        expect(screen.getByTestId('loading')).toHaveTextContent('no');
    });

    it('should call useCartListeners with correct params', () => {
        const mockUseCartListeners = require('@/providers/cart/utils/useCartListeners').useCartListeners;
        
        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        expect(mockUseCartListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                supabase: expect.any(Object),
                cartID: null,
                loggedIn: false,
                refreshCart: expect.any(Function),
                resetCart: expect.any(Function),
            })
        );
    });

    it('should create supabase client once', () => {
        const { createFrontendClient } = require('@/utils/db/client');
        
        const { rerender } = render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        rerender(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        expect(createFrontendClient).toHaveBeenCalledTimes(1);
    });

    it('should not refresh when user is not logged in', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        mockUseUserState.mockReturnValue({ user: null, loggedIn: false });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        expect(mockGetCartData).not.toHaveBeenCalled();
    });

    it('should not refresh when user id is undefined', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        mockUseUserState.mockReturnValue({ user: { id: undefined }, loggedIn: true });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        expect(mockGetCartData).not.toHaveBeenCalled();
    });

    it('should call refreshCart and dispatch START_LOADING', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        mockUseUserState.mockReturnValue({ user: { id: 'user-123' }, loggedIn: true });
        mockGetCartData.mockResolvedValue({ data: { cartID: 'cart-123', books: [] }, error: null });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(mockGetCartData).toHaveBeenCalledWith('user-123');
        });
    });

    it('should dispatch SET_CART_DATA when refreshCart succeeds', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        mockUseUserState.mockReturnValue({ user: { id: 'user-123' }, loggedIn: true });
        mockGetCartData.mockResolvedValue({ 
            data: { cartID: 'new-cart', books: [{ book_id: 'book-1', price: '10.00', quantity: 1 }] }, 
            error: null 
        });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('cart-id')).toHaveTextContent('new-cart');
        });
    });

    it('should dispatch SET_ERROR when refreshCart fails', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockUseUserState.mockReturnValue({ user: { id: 'user-123' }, loggedIn: true });
        mockGetCartData.mockRejectedValue(new Error('Network error'));

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        
        consoleSpy.mockRestore();
    });

    it('should not refresh when user is not logged in', async () => {
        const mockGetCartData = require('@/data/cart/GetCartData').getCartData;
        const mockUseUserState = require('@/providers/user/utils/useUser').useUserState;
        mockUseUserState.mockReturnValue({ user: null, loggedIn: false });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        expect(mockGetCartData).not.toHaveBeenCalled();
    });
});
