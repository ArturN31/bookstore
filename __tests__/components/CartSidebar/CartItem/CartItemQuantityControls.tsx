import { CartItemQuantityControls } from '@/components/CartSidebar/CartItem/CartItemQuantityControls';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { fireEvent, render, screen } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import { useActionState } from 'react';

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

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

const mockFormAction = jest.fn();

let mockTransitionPending = false;

jest.mock('react', () => {
    const actual = jest.requireActual('react');
    return {
        ...actual,
        useActionState: jest.fn((action, initialState) => [initialState, jest.fn()]),
        useTransition: jest.fn(() => [mockTransitionPending, (cb: any) => cb()]),
    };
});

describe('APP - CartSidebar - CartItemQuantityControls', () => {
    const mockedEnqueueSnackbar = enqueueSnackbar as jest.Mock;
    const mockRefreshCart = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        (useCartActions as jest.Mock).mockReturnValue({ refreshCart: mockRefreshCart });
        (useCartState as jest.Mock).mockReturnValue({ cartBooks: [], loading: false });
        (useActionState as jest.Mock).mockImplementation((action, initialState) => {
            const dispatch = async (formData: FormData) => {
                mockFormAction(formData);
                if (typeof action === 'function') {
                    await action(initialState, formData);
                }
            };
            return [initialState, dispatch, false];
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should decrement the quantity', () => {
        render(
            <CartItemQuantityControls
                quantity={5}
                book={mockedBook}
            />,
        );
        const decrementBtn = screen.getByTestId('cart-item-decrement-btn');
        fireEvent.click(decrementBtn);
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should prepare correct FormData for remove when decrementing from 1', () => {
        render(
            <CartItemQuantityControls
                quantity={1}
                book={mockedBook}
            />,
        );
        const decrementBtn = screen.getByTestId('cart-item-decrement-btn');
        fireEvent.click(decrementBtn);

        const formData = mockFormAction.mock.calls[0][0] as FormData;

        expect(formData.get('action-type')).toBe('REMOVE');
        expect(formData.get('book-id')).toBe(mockedBook.id);
    });

    it('should display toast when reaching purchase limit (10)', () => {
        render(
            <CartItemQuantityControls
                quantity={10}
                book={mockedBook}
            />,
        );
        const incrementBtn = screen.getByTestId('cart-item-increment-btn');
        fireEvent.click(incrementBtn);

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith(
            'You can only purchase 10 of the same books.',
            { variant: 'warning' },
        );
    });

    it('should show singular stock warning when only 1 book is left', () => {
        const lowStockBook = { ...mockedBook, stock_quantity: 1 };
        render(
            <CartItemQuantityControls
                quantity={1}
                book={lowStockBook}
            />,
        );

        const incrementBtn = screen.getByTestId('cart-item-increment-btn');
        fireEvent.click(incrementBtn);

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith('There is only 1 book left in stock.', {
            variant: 'warning',
        });
    });

    it('should show plural stock warning when localQuantity reaches stock limit', () => {
        const limitedStockBook = { ...mockedBook, stock_quantity: 3 };
        render(
            <CartItemQuantityControls
                quantity={3}
                book={limitedStockBook}
            />,
        );

        const incrementBtn = screen.getByTestId('cart-item-increment-btn');
        fireEvent.click(incrementBtn);

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith(
            'There are only 3 books left in stock.',
            { variant: 'warning' },
        );
    });

    it('should increment quantity and call debounced update after 500ms', () => {
        render(
            <CartItemQuantityControls
                quantity={5}
                book={mockedBook}
            />,
        );
        const incrementBtn = screen.getByTestId('cart-item-increment-btn');

        fireEvent.click(incrementBtn);

        expect(screen.getByText('6')).toBeInTheDocument();
        expect(mockFormAction).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);

        const formData = mockFormAction.mock.calls[0][0] as FormData;
        expect(formData.get('action-type')).toBe('UPDATE');
        expect(formData.get('book-quantity')).toBe('6');
    });

    it('should show a success snackbar when state.success is true', () => {
        mockedEnqueueSnackbar.mockClear();

        (useActionState as jest.Mock).mockReturnValue([
            {
                success: true,
                message: 'Item updated successfully!',
                timestamp: Date.now(),
            },
            jest.fn(),
            false,
        ]);

        render(
            <CartItemQuantityControls
                quantity={5}
                book={mockedBook}
            />,
        );

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith('Item updated successfully!', {
            variant: 'success',
        });
    });

    it('should call enqueueSnackbar with "warning" variant on failure', () => {
        (useActionState as jest.Mock).mockReturnValue([
            {
                success: false,
                message: 'An error occurred during update',
                timestamp: Date.now(),
            },
            jest.fn(),
            false,
        ]);

        render(
            <CartItemQuantityControls
                quantity={5}
                book={mockedBook}
            />,
        );

        expect(mockedEnqueueSnackbar).toHaveBeenCalledWith('An error occurred during update', {
            variant: 'warning',
        });
    });

    it('should disable buttons and change text color when isPending is true', () => {
        mockTransitionPending = true;

        (useActionState as jest.Mock).mockReturnValue([{ success: false, message: '' }, jest.fn()]);

        render(
            <CartItemQuantityControls
                quantity={5}
                book={mockedBook}
            />,
        );

        const decrementBtn = screen.getByTestId('cart-item-decrement-btn');
        const incrementBtn = screen.getByTestId('cart-item-increment-btn');
        const quantityText = screen.getByText('5');

        expect(decrementBtn).toBeDisabled();
        expect(incrementBtn).toBeDisabled();
        expect(quantityText).toHaveClass('text-gray-400');

        mockTransitionPending = false;
    });
});
