import { CartItemRemove } from '@/components/CartSidebar/CartItem/CartItemRemove';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { screen, render, fireEvent, act } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import React from 'react';

const mockedBook: Book = {
    id: '1',
    created_at: '',
    updated_at: '',
    title: 'New Book',
    author: '',
    genre: '',
    publisher: '',
    publication_date: '',
    price: '£10.45',
    description: '',
    format: '',
    page_count: 100,
    image_url: '',
    stock_quantity: 20,
    is_active: true,
    reviews: [],
};

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

const globalMockRefreshCart = jest.fn();

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        loggedIn: true,
        profileExists: true,
    })),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

describe('APP - CartItem - Remove', () => {
    const mockFormAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
        });
        (useCartActions as jest.Mock).mockReturnValue({
            refreshCart: globalMockRefreshCart,
        });

        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });

        jest.spyOn(React, 'useActionState').mockReturnValue([
            { success: false, message: '' },
            mockFormAction,
            false,
        ]);
    });

    it('should submit formData', async () => {
        render(<CartItemRemove book={mockedBook} />);
        const button = screen.getByRole('button');

        await act(async () => {
            fireEvent.click(button);
        });

        expect(mockFormAction).toHaveBeenCalled();
    });

    it('should refresh cart on submit success', async () => {
        (useCartState as jest.Mock).mockReturnValue({ cartBooks: [] });

        const useActionStateMock = jest.spyOn(React, 'useActionState');
        useActionStateMock.mockReturnValue([{ success: true, message: '' }, jest.fn(), false]);

        render(<CartItemRemove book={mockedBook} />);

        await act(async () => {
            expect(globalMockRefreshCart).toHaveBeenCalled();
        });
    });

    it('should cover: if (isButtonDisabled) return', async () => {
        (useUserState as jest.Mock).mockReturnValue({ loggedIn: false, profileExists: true });
        render(<CartItemRemove book={mockedBook} />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        await act(async () => {
            fireEvent.submit(button.closest('form')!);
        });

        expect(mockFormAction).not.toHaveBeenCalled();
    });

    it('should cover snackbar for success message', () => {
        jest.spyOn(React, 'useActionState').mockReturnValue([
            { success: true, message: 'Item removed' },
            mockFormAction,
            false,
        ]);
        render(<CartItemRemove book={mockedBook} />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Item removed', { variant: 'success' });
    });

    it('should cover snackbar for warning message', () => {
        jest.spyOn(React, 'useActionState').mockReturnValue([
            { success: false, message: 'Failed to remove' },
            mockFormAction,
            false,
        ]);
        render(<CartItemRemove book={mockedBook} />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Failed to remove', { variant: 'warning' });
    });

    it('should toggle icons on hover', () => {
        render(<CartItemRemove book={mockedBook} />);
        const button = screen.getByRole('button');
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
    });
});
