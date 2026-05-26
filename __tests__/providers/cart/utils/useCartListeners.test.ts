import { renderHook } from '@testing-library/react';
import { useCartListeners } from '@/providers/cart/utils/useCartListeners';

describe('useCartListeners', () => {
    const mockSupabase = {
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel-123'),
        removeChannel: jest.fn(),
    };

    const mockOnCartChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set up channel when cartID is provided', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                onCartChange: mockOnCartChange,
            }),
        );

        expect(mockSupabase.channel).toHaveBeenCalledWith('cart-sync-cart-123');
        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                event: '*',
                schema: 'public',
                table: 'shopping_cart_items',
                filter: 'cart_id=eq.cart-123',
            }),
            expect.any(Function),
        );
        expect(mockSupabase.subscribe).toHaveBeenCalled();
    });

    it('should not set up channel when cartID is null', () => {
        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: null,
                onCartChange: mockOnCartChange,
            }),
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should call onCartChange when the postgres event callback is executed', () => {
        let callback: (() => void) | null = null;

        mockSupabase.on.mockImplementation((_event: string, _config: any, cb: () => void) => {
            callback = cb;
            return mockSupabase;
        });

        renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                onCartChange: mockOnCartChange,
            }),
        );

        if (callback) {
            (callback as () => void)();
        }

        expect(mockOnCartChange).toHaveBeenCalledTimes(1);
    });

    it('should remove the specific channel on unmount', () => {
        const { unmount } = renderHook(() =>
            useCartListeners({
                supabase: mockSupabase as any,
                cartID: 'cart-123',
                onCartChange: mockOnCartChange,
            }),
        );

        unmount();

        expect(mockSupabase.removeChannel).toHaveBeenCalledWith('channel-123');
    });

    it('should re-subscribe when cartID changes', () => {
        const { rerender } = renderHook(
            ({ cartID }) =>
                useCartListeners({
                    supabase: mockSupabase as any,
                    cartID,
                    onCartChange: mockOnCartChange,
                }),
            { initialProps: { cartID: 'cart-1' } },
        );

        expect(mockSupabase.channel).toHaveBeenCalledWith('cart-sync-cart-1');

        rerender({ cartID: 'cart-2' });

        expect(mockSupabase.removeChannel).toHaveBeenCalled();
        expect(mockSupabase.channel).toHaveBeenCalledWith('cart-sync-cart-2');
    });
});
