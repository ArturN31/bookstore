import { render, screen, waitFor, act } from '@testing-library/react';
import { CartProvider } from '@/providers/cart/CartProvider';
import { useCartState, useCartActions } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { getCartData } from '@/data/cart/GetCartData';
import { ComponentProps } from 'react';

type TargetCartType = ComponentProps<typeof CartProvider>['initialCart'];

let capturedOnCartChange: (() => void) | null = null;

jest.mock('@/providers/user/utils/useUser');
jest.mock('@/utils/db/client', () => ({
    createFrontendClient: jest.fn(() => ({
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel'),
        removeChannel: jest.fn(),
    })),
}));
jest.mock('@/data/cart/GetCartData', () => ({
    getCartData: jest.fn(),
}));
jest.mock('@/providers/cart/utils/useCartListeners', () => ({
    useCartListeners: jest.fn(({ onCartChange }) => {
        capturedOnCartChange = onCartChange;
    }),
}));

const TestConsumer = () => {
    const { cartID, loading } = useCartState();
    const { refreshCart, resetCart } = useCartActions();
    const { user } = useUserState();

    return (
        <div>
            <span data-testid="cart-id">{cartID || 'none'}</span>
            <span data-testid="loading">{loading ? 'yes' : 'no'}</span>
            <button
                data-testid="refresh-btn"
                onClick={() => {
                    refreshCart(user?.id ?? undefined);
                }}
            >
                Refresh
            </button>
            <button
                data-testid="reset-btn"
                onClick={() => {
                    resetCart();
                }}
            >
                Reset
            </button>
        </div>
    );
};

describe('CartProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnCartChange = null;
        (useUserState as jest.Mock).mockReturnValue({ user: { id: 'user-123' }, loggedIn: true });
    });

    it('should ignore data refresh if the user changed during the request (Race Condition Guard)', async () => {
        let resolveRequest: (value: unknown) => void = () => {};
        const slowPromise = new Promise((resolve) => {
            resolveRequest = resolve;
        });
        (getCartData as jest.Mock).mockReturnValue(slowPromise);

        const { rerender } = render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        (useUserState as jest.Mock).mockReturnValue({ user: { id: 'user-456' }, loggedIn: true });

        rerender(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            resolveRequest({ data: { cartID: 'stale-cart', books: [] }, error: null });
        });

        expect(screen.getByTestId('cart-id')).toHaveTextContent('none');
    });

    it('should catch and log errors when response.error is present', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (getCartData as jest.Mock).mockResolvedValue({ data: null, error: 'Database Error' });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Cart Refresh Failed:', expect.any(Error));
        });

        expect(screen.getByTestId('loading')).toHaveTextContent('no');
        consoleSpy.mockRestore();
    });

    it('should handle successful data refresh', async () => {
        (getCartData as jest.Mock).mockResolvedValue({
            data: { cartID: 'new-cart', books: [] },
            error: null,
        });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('cart-id')).toHaveTextContent('new-cart');
        });
    });

    it('should evaluate coalescing fallbacks safely when response data elements are missing', async () => {
        (getCartData as jest.Mock).mockResolvedValue({
            data: null,
            error: null,
        });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('cart-id')).toHaveTextContent('none');
        });
    });

    it('should ignore the loading trigger completely and return early if targetId evaluates to falsy', async () => {
        (useUserState as jest.Mock).mockReturnValue({ user: null, loggedIn: false });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        expect(screen.getByTestId('loading')).toHaveTextContent('no');
        expect(getCartData).not.toHaveBeenCalled();
    });

    it('should catch synchronous runtime or network rejections thrown inside the fetch block', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (getCartData as jest.Mock).mockRejectedValue(new Error('Fatal Network Error'));

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Cart Refresh Failed:', expect.any(Error));
        });

        expect(screen.getByTestId('loading')).toHaveTextContent('no');
        consoleSpy.mockRestore();
    });

    it('should ignore dispatching structural error configurations if user parameters shifted during a rejected promise fallback', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        let rejectRequest: (reason: unknown) => void = () => {};
        const brokenPromise = new Promise((_, reject) => {
            rejectRequest = reject;
        });
        (getCartData as jest.Mock).mockReturnValue(brokenPromise);

        const { rerender } = render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('refresh-btn').click();
        });

        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-changed-789' },
            loggedIn: true,
        });

        rerender(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            rejectRequest(new Error('Delayed Fail Context Exception'));
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Cart Refresh Failed:', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('should clear active user reference and dispatch reset type when resetCart is called', async () => {
        const mockCart = {
            cartID: 'existing-cart',
        } as NonNullable<TargetCartType>;

        render(
            <CartProvider initialCart={mockCart}>
                <TestConsumer />
            </CartProvider>,
        );

        expect(screen.getByTestId('cart-id')).toHaveTextContent('existing-cart');

        await act(async () => {
            screen.getByTestId('reset-btn').click();
        });

        expect(screen.getByTestId('cart-id')).toHaveTextContent('none');
    });

    it('should call refreshCart when onCartChange is executed and an active user is present', async () => {
        (getCartData as jest.Mock).mockResolvedValue({
            data: { cartID: 'realtime-cart-update', books: [] },
            error: null,
        });

        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        expect(capturedOnCartChange).toBeInstanceOf(Function);

        await act(async () => {
            if (capturedOnCartChange) capturedOnCartChange();
        });

        await waitFor(() => {
            expect(getCartData).toHaveBeenCalledWith('user-123');
            expect(screen.getByTestId('cart-id')).toHaveTextContent('realtime-cart-update');
        });
    });

    it('should skip refreshCart on onCartChange execution if activeUserId is empty or nullified', async () => {
        render(
            <CartProvider initialCart={null}>
                <TestConsumer />
            </CartProvider>,
        );

        await act(async () => {
            screen.getByTestId('reset-btn').click();
        });

        jest.clearAllMocks();

        await act(async () => {
            if (capturedOnCartChange) capturedOnCartChange();
        });

        expect(getCartData).not.toHaveBeenCalled();
    });
});
