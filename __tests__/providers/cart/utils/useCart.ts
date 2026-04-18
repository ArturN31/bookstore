import { useCartState, useCartActions } from '@/providers/cart/utils/useCart';
import { CartStateContext, CartActionsContext } from '@/providers/cart/CartContext';

describe('useCart', () => {
    describe('useCartState', () => {
        it('should throw error when used outside CartProvider', () => {
            jest.spyOn(require('react'), 'useContext').mockReturnValue(undefined);

            expect(() => useCartState()).toThrow('useCartState must be used within CartProvider');
        });

        it('should return context when used inside CartProvider', () => {
            const mockContext = { cart: null, loading: false };
            jest.spyOn(require('react'), 'useContext').mockReturnValue(mockContext);

            const result = useCartState();

            expect(result).toEqual(mockContext);
        });
    });

    describe('useCartActions', () => {
        it('should throw error when used outside CartProvider', () => {
            jest.spyOn(require('react'), 'useContext').mockReturnValue(undefined);

            expect(() => useCartActions()).toThrow('useCartActions must be used within CartProvider');
        });

        it('should return context when used inside CartProvider', () => {
            const mockContext = { refreshCart: jest.fn() };
            jest.spyOn(require('react'), 'useContext').mockReturnValue(mockContext);

            const result = useCartActions();

            expect(result).toEqual(mockContext);
        });
    });
});
