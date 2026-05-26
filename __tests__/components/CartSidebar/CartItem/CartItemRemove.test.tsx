import { CartItemRemove } from '@/components/CartSidebar/CartItem/CartItemRemove';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserState } from '@/providers/user/utils/useUser';
import { screen, render, fireEvent, act } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import React from 'react';

const createMockBook = (overrides: Partial<Book>): Book => ({
    id: '1',
    title: 'Default',
    author: 'Author',
    genre: 'Genre',
    description: 'Desc',
    price: '10',
    rating: 4,
    review_count: 10,
    sales_count: null,
    stock_quantity: 100,
    image_url: '',
    publisher: 'Pub',
    publication_date: '2024',
    format: 'Paperback',
    page_count: 200,
    created_at: '',
    updated_at: '',
    is_active: true,
    ...overrides,
});

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

const globalMockRefreshCart = jest.fn();

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        user: { id: 'user-123' },
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
            user: { id: 'user-123' },
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
        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);
        const button = screen.getByRole('button');

        await act(async () => {
            fireEvent.click(button);
        });

        expect(mockFormAction).toHaveBeenCalled();
    });

    it('should refresh cart on submit success', async () => {
        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: true,
            profileExists: true,
        });

        jest.spyOn(React, 'useActionState').mockImplementation((action, initialState) => {
            const [state, setState] = React.useState(initialState);
            const dispatch = async () => {
                setState({ success: true, message: 'Item removed', timestamp: Date.now() });
            };
            return [state, dispatch, false];
        });

        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);

        const button = screen.getByRole('button');
        await act(async () => {
            fireEvent.click(button);
        });

        expect(globalMockRefreshCart).toHaveBeenCalledWith('user-123');
    });

    it('should cover: if (isButtonDisabled) return', async () => {
        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: false,
            profileExists: true,
        });
        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);

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
        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Item removed', { variant: 'success' });
    });

    it('should cover snackbar for warning message', () => {
        jest.spyOn(React, 'useActionState').mockReturnValue([
            { success: false, message: 'Failed to remove' },
            mockFormAction,
            false,
        ]);
        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);
        expect(enqueueSnackbar).toHaveBeenCalledWith('Failed to remove', { variant: 'warning' });
    });

    it('should toggle icons on hover', () => {
        render(<CartItemRemove book={createMockBook({ id: '1', title: 'Book 1' })} />);
        const button = screen.getByRole('button');
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
    });
});
