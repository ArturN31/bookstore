import { ChangeQuantityForm } from '@/components/CartForms/ChangeQuantityForm';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { fireEvent, render, screen } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import { useActionState, useOptimistic, useTransition } from 'react';

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
        useOptimistic: jest.fn((initial: number) => [initial, jest.fn()]),
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
        (useTransition as jest.Mock).mockImplementation(() => [false, (cb: () => void) => cb()]);
        (useOptimistic as jest.Mock).mockImplementation((initial: number) => [initial, jest.fn()]);
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

    it('should display the optimisticQuantity if it differs from currentBookQuantity', () => {
        (useOptimistic as jest.Mock).mockReturnValueOnce([5, jest.fn()]);

        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox') as HTMLSelectElement;

        expect(select.value).toBe('5');
    });

    it('should parse integer and set optimistic state when onChange fires', () => {
        const mockSetOptimistic = jest.fn();
        (useOptimistic as jest.Mock).mockReturnValueOnce([2, mockSetOptimistic]);

        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox');

        fireEvent.change(select, { target: { value: '4' } });

        expect(mockSetOptimistic).toHaveBeenCalledWith(4);
    });

    it('should format FormData correctly and submit formAction inside transition', () => {
        const mockFormAction = jest.fn();
        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            mockFormAction,
            false,
        ]);

        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox');

        fireEvent.change(select, { target: { value: '7' } });

        expect(mockFormAction).toHaveBeenCalledTimes(1);

        const submittedFormData = mockFormAction.mock.calls[0][0] as FormData;

        expect(submittedFormData).toBeInstanceOf(FormData);
        expect(submittedFormData.get('book-id')).toBe('1');
        expect(submittedFormData.get('book-quantity')).toBe('7');
        expect(submittedFormData.get('action-type')).toBe('UPDATE');
    });

    it('should disable select and block handleChange execution if isPending is true', () => {
        const mockFormAction = jest.fn();
        const mockSetOptimistic = jest.fn();

        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            mockFormAction,
            false,
        ]);

        (useTransition as jest.Mock).mockReturnValueOnce([true, jest.fn()]);
        (useOptimistic as jest.Mock).mockReturnValueOnce([2, mockSetOptimistic]);

        render(<ChangeQuantityForm bookID="1" />);
        const select = screen.getByRole('combobox') as HTMLSelectElement;

        expect(select.disabled).toBe(true);

        fireEvent.change(select, { target: { value: '5' } });

        expect(mockSetOptimistic).not.toHaveBeenCalled();
        expect(mockFormAction).not.toHaveBeenCalled();
    });
});
