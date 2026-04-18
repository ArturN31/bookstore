import { renderHook } from '@testing-library/react';
import { useCartListeners } from '@/providers/cart/utils/useCartListeners';

describe('useCartListeners', () => {
    const mockSupabase = {
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel-123'),
        removeChannel: jest.fn(),
    };

    const mockRefreshCart = jest.fn();
    const mockResetCart = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call resetCart when not logged in', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: null,
                loggedIn: false,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockResetCart).toHaveBeenCalled();
    });

    it('should not call resetCart when logged in', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockResetCart).not.toHaveBeenCalled();
    });

    it('should set up channel when logged in with cartID', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.channel).toHaveBeenCalledWith('cart-sync-cart-123');
        expect(mockSupabase.on).toHaveBeenCalled();
        expect(mockSupabase.subscribe).toHaveBeenCalled();
    });

    it('should not set up channel when not logged in', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: null,
                loggedIn: false,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should not set up channel when logged in but no cartID', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: null,
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should call refreshCart when postgres change event fires', () => {
        let callback: (() => void) | null = null;

        mockSupabase.on.mockImplementation((event: string, config: any, cb: () => void) => {
            callback = cb;
            return mockSupabase;
        });

        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        if (callback) {
            callback();
        }

        expect(mockRefreshCart).toHaveBeenCalled();
    });

    it('should remove channel on unmount', () => {
        const { unmount } = renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        unmount();

        expect(mockSupabase.removeChannel).toHaveBeenCalledWith('channel-123');
    });

    it('should filter by cart_id', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                filter: 'cart_id=eq.cart-123',
            }),
            expect.any(Function)
        );
    });

    it('should listen for all events', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                event: '*',
            }),
            expect.any(Function)
        );
    });

    it('should listen to shopping_cart_items table', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                loggedIn: true,
                refreshCart: mockRefreshCart,
                resetCart: mockResetCart,
            })
        );

        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                table: 'shopping_cart_items',
            }),
            expect.any(Function)
        );
    });
});
