import { ChangeQuantityForm } from '@/components/CartForms/ChangeQuantityForm';
import { CartAction } from '@/data/actions/CartForm/CartAction';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { fireEvent, render, screen } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import React, { useActionState } from 'react';

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        user: { id: 'user-123' },
        username: 'testuser',
        loggedIn: true,
        profileExists: true,
        loading: false,
    })),
}));

jest.mock('react', () => {
    const actualReact = jest.requireActual('react');
    return {
        ...actualReact,
        useActionState: jest.fn(),
        useTransition: jest.fn(() => [false, (cb: () => void) => cb()]),
    };
});

describe('APP - CartForms - ChangeQuantityForm', () => {
    const mockRefreshCart = jest.fn();
    const mockCartBooks = [{ id: '1', quantity: 2 }];
    const mockedEnqueueSnackbar = enqueueSnackbar as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: mockCartBooks,
        });
        (useCartActions as jest.Mock).mockReturnValue({
            refreshCart: mockRefreshCart,
        });
        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-123' },
            username: 'testuser',
            loggedIn: true,
            profileExists: true,
            loading: false,
        });
        (useActionState as jest.Mock).mockImplementation((action, initialState) => [
            initialState,
            action,
            false,
        ]);
    });

    it('should fallback to initial quantity of 1 if book is not in cartBooks', () => {
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
        });

        render(<ChangeQuantityForm bookID="999" />);

        const select = screen.getByRole('combobox') as HTMLSelectElement;

        expect(select.value).toBe('1');
    });

    it('should initialize with the current book quantity from provider', () => {
        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('2');
    });

    it('should submit the form with correct FormData and Action Type', () => {
        const mockDispatch = jest.fn();
        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            mockDispatch,
            false,
        ]);

        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox') as HTMLSelectElement;

        // Change the quantity to enable the submit button
        fireEvent.change(select, { target: { value: '8' } });

        const submitBtn = screen.getByRole('button', { name: /update cart/i });

        fireEvent.click(submitBtn);

        const formData = mockDispatch.mock.calls[0][0];
        expect(formData.get('book-id')).toBe('1');
        expect(formData.get('book-quantity')).toBe('8');
        expect(formData.get('action-type')).toBe('UPDATE');
    });

    it('should call enqueueSnackbar when item is removed successfully', () => {
        (useActionState as jest.Mock).mockReturnValue([
            {
                success: true,
                message: 'Item removed successfully.',
                timestamp: Date.now(),
            },
            jest.fn(),
            false,
        ]);

        render(<ChangeQuantityForm bookID="1" />);

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith('Item removed successfully.', {
            variant: 'success',
        });
    });

    it('should show warning snackbar on failure', () => {
        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: 'Failed to update item in cart.' },
            jest.fn(),
            false,
        ]);

        render(<ChangeQuantityForm bookID="1" />);

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith('Failed to update item in cart.', {
            variant: 'error',
        });
    });

    it('should show loading spinner when isPending is true', () => {
        // Mock useTransition to return isPending = true
        (React.useTransition as jest.Mock).mockReturnValueOnce([true, jest.fn()]);

        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            jest.fn(),
            false,
        ]);

        const { container } = render(<ChangeQuantityForm bookID="1" />);

        // Check for the loading spinner (span with animate-spin and rounded-full classes)
        const spinner = container.querySelector('span.animate-spin');
        expect(spinner).toBeInTheDocument();

        // Button should show "Updating..." text and be disabled
        const submitBtn = screen.getByText(/updating/i).closest('button');
        expect(submitBtn).toBeDisabled();
    });
});
