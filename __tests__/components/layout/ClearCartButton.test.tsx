import { useCartActions } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { CartAction } from '@/data/cart/CartAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import * as React from 'react';
import { ClearCartButton } from '@/components/CartSidebar/ClearCartButton';

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartActions: jest.fn(),
}));

jest.mock('@/data/cart/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

const mockUseUserState = jest.mocked(useUserState);
const mockUseCartActions = jest.mocked(useCartActions);
const mockCartAction = jest.mocked(CartAction);
const mockEnqueueSnackbar = jest.mocked(enqueueSnackbar);

describe('ClearCartButton', () => {
    const mockRefreshCart = jest.fn();
    const mockResetCart = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseCartActions.mockReturnValue({
            refreshCart: mockRefreshCart,
            resetCart: mockResetCart,
        });
        mockUseUserState.mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: true,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);
    });

    it('should render correctly when enabled', () => {
        render(<ClearCartButton />);

        const button = screen.getByRole('button', { name: /clear all items from cart/i });
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
        expect(screen.getByText('Clear Cart')).toBeInTheDocument();
    });

    it('should be disabled when user is not logged in', () => {
        mockUseUserState.mockReturnValue({
            user: null,
            loggedIn: false,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        render(<ClearCartButton />);

        const button = screen.getByRole('button', { name: /clear all items from cart/i });
        expect(button).toBeDisabled();
    });

    it('should be disabled when profile does not exist', () => {
        mockUseUserState.mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: true,
            profileExists: false,
        } as unknown as ReturnType<typeof useUserState>);

        render(<ClearCartButton />);

        const button = screen.getByRole('button', { name: /clear all items from cart/i });
        expect(button).toBeDisabled();
    });

    it('should not trigger form action if button is disabled on submit', () => {
        mockUseUserState.mockReturnValue({
            user: null,
            loggedIn: false,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        render(<ClearCartButton />);

        const form = screen.getByRole('form', { name: 'clear-cart-form' });
        fireEvent.submit(form);

        expect(mockCartAction).not.toHaveBeenCalled();
    });

    it('should trigger form action and handle submission correctly', async () => {
        mockCartAction.mockResolvedValueOnce({
            success: false,
            message: '',
        });

        render(<ClearCartButton />);

        const form = screen.getByRole('form', { name: 'clear-cart-form' });
        fireEvent.submit(form);

        expect(mockCartAction).toHaveBeenCalled();
    });

    it('should call enqueueSnackbar and refreshCart on successful action state change', async () => {
        mockCartAction.mockResolvedValueOnce({
            success: true,
            message: 'Cart cleared successfully',
            timestamp: 1,
        });

        render(<ClearCartButton />);

        const form = screen.getByRole('form', { name: 'clear-cart-form' });
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Cart cleared successfully', {
                variant: 'success',
            });
            expect(mockRefreshCart).toHaveBeenCalledWith('user-123');
        });
    });

    it('should call enqueueSnackbar when message includes cart and success is true without clear', async () => {
        mockCartAction.mockResolvedValueOnce({
            success: true,
            message: 'Cart updated successfully',
            timestamp: 1,
        });

        render(<ClearCartButton />);

        const form = screen.getByRole('form', { name: 'clear-cart-form' });
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Cart updated successfully', {
                variant: 'success',
            });
        });
    });

    it('should call enqueueSnackbar with warning variant on failure message', async () => {
        mockCartAction.mockResolvedValueOnce({
            success: false,
            message: 'Failed to clear cart',
            timestamp: 1,
        });

        render(<ClearCartButton />);

        const form = screen.getByRole('form', { name: 'clear-cart-form' });
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Failed to clear cart', {
                variant: 'warning',
            });
            expect(mockRefreshCart).not.toHaveBeenCalled();
        });
    });
});
