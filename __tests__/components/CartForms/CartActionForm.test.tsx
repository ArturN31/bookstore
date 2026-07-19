import { CartActionForm } from '@/components/CartForms/CartActionForm';
import { useUserState } from '@/providers/user/utils/useUser';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import React, { act, useActionState } from 'react';
import { CartAction } from '@/data/actions/CartForm/CartAction';

const globalMockRefreshCart = jest.fn();

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('react', () => {
    const actual = jest.requireActual('react');
    return {
        ...actual,
        useActionState: jest.fn(),
        useTransition: jest.fn(() => [false, (cb: () => void) => cb()]),
    };
});

jest.mock('@/providers/user/utils/useUser', () => ({ useUserState: jest.fn() }));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));

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

describe('APP - CartForms - CartActionForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useCartState as jest.Mock).mockReturnValue({ cartBooks: [], cartBooksAmount: 0 });
        (useCartActions as jest.Mock).mockReturnValue({ refreshCart: globalMockRefreshCart });
        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: true,
            profileExists: true,
            loading: false,
        });

        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            jest.fn(),
            false,
        ]);
    });

    it('should call enqueueSnackbar with "error" variant when success is false', () => {
        (useActionState as jest.Mock).mockReturnValue([
            {
                success: false,
                message: 'Failed to update cart',
                timestamp: Date.now(),
            },
            jest.fn(),
            false,
        ]);

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(enqueueSnackbar).toHaveBeenCalledWith('Failed to update cart', {
            variant: 'error',
        });
    });

    it('should call enqueueSnackbar with "success" variant when success is true', () => {
        (useActionState as jest.Mock).mockReturnValue([
            {
                success: true,
                message: 'Successfully updated cart',
                timestamp: Date.now(),
            },
            jest.fn(),
            false,
        ]);

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(enqueueSnackbar).toHaveBeenCalledWith('Successfully updated cart', {
            variant: 'success',
        });
    });

    it('should call refreshCart when the form is submitted successfully', async () => {
        (CartAction as jest.Mock).mockResolvedValue({ success: true, message: 'Success' });

        (useActionState as jest.Mock).mockImplementation((action, initialState) => {
            const [state, setState] = React.useState(initialState);
            const dispatch = async (fd: FormData) => {
                const result = await action(state, fd);
                setState(result);
            };
            return [state, dispatch, false];
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        const submitBtn = screen.getByRole('button', { name: /add to cart/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(globalMockRefreshCart).toHaveBeenCalled();
        });
    });

    it('should prevent form submission when isButtonDisabled or isPending is true', () => {
        const mockDispatch = jest.fn();
        (useActionState as jest.Mock).mockReturnValue([
            { success: false, message: '' },
            mockDispatch,
            false,
        ]);

        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: false,
            profileExists: false,
            loading: false,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        const form = screen.getByRole('button').closest('form')!;
        const submitEvent = fireEvent.submit(form);

        expect(submitEvent).toBe(false);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should apply "Remove from Cart" styles when book is already in cart', () => {
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [{ id: '1', quantity: 1 }],
            cartBooksAmount: 1,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass('border', 'border-yellow', 'text-yellow');
        expect(button).not.toHaveClass('bg-yellow', 'text-gunmetal');
    });

    it('should NOT display "Cart is full" warning if already in cart (Remove mode)', () => {
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [{ id: '1', quantity: 1 }],
            cartBooksAmount: 10,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(screen.queryByText(/Cart is full/i)).not.toBeInTheDocument();
    });

    it('should display "Out of stock" status when stock is 0', () => {
        render(
            <CartActionForm
                bookID="1"
                stock={0}
            />,
        );

        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    });

    it('should display "Limited Stock" warning when stock is low (1-25) and in add mode', () => {
        render(
            <CartActionForm
                bookID="1"
                stock={15}
            />,
        );

        expect(screen.getByText(/limited stock/i)).toBeInTheDocument();
        expect(screen.getByText(/15 left/i)).toBeInTheDocument();
    });

    it('should display "Sign in to use cart" when not logged in and stock is not low', () => {
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: false,
            profileExists: false,
            loading: false,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(screen.getByText(/sign in to use cart/i)).toBeInTheDocument();
    });

    it('should display "Complete your user profile" when logged in but profile does not exist and stock is not low', () => {
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: true,
            profileExists: false,
            loading: false,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(screen.getByText(/complete your user profile/i)).toBeInTheDocument();
    });

    it('should display "Cart is full" warning when cart has 10 items, in add mode, and stock is not low', () => {
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
            cartBooksAmount: 10,
        });

        render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(screen.getByText('Cart is full (Max 10 items)')).toBeInTheDocument();
    });

    it('BRANCH COVERAGE: should return null from getStatusContent when userLoading is true (covers line 50 true branch)', () => {
        (useUserState as jest.Mock).mockReturnValue({
            user: { id: 'user-123' },
            loggedIn: true,
            profileExists: true,
            loading: true,
        });

        const { container } = render(
            <CartActionForm
                bookID="1"
                stock={0}
            />,
        );

        expect(container.querySelector('.text-\\[10px\\]')).not.toBeInTheDocument();
        expect(screen.queryByText(/out of stock/i)).not.toBeInTheDocument();
    });

    it('should not display any status when user is loaded, logged in, profile exists, and cart is not full', () => {
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: true,
            profileExists: true,
            loading: false,
        });
        (useCartState as jest.Mock).mockReturnValue({
            cartBooks: [],
            cartBooksAmount: 5,
        });

        const { container } = render(
            <CartActionForm
                bookID="1"
                stock={createMockBook({ id: '1', title: 'Book 1' }).stock_quantity}
            />,
        );

        expect(container.querySelector('.text-\\[10px\\]')).not.toBeInTheDocument();
    });
});
