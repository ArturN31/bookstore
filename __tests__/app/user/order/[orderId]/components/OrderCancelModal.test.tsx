import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderCancelModal } from '@/app/user/order/[orderId]/components/OrderCancelModal';
import { cancelOrderAction } from '@/data/orders/OrderCancelAction';

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: mockRefresh,
    }),
}));

jest.mock('@/data/orders/OrderCancelAction', () => ({
    cancelOrderAction: jest.fn(),
}));

describe('OrderCancelModal', () => {
    const mockCancelOrderAction = jest.mocked(cancelOrderAction);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when orderStatus is not pending', () => {
        const { container } = render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="paid"
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders cancel order button when status is pending', () => {
        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );
        expect(screen.getByRole('button', { name: 'Cancel Order' })).toBeInTheDocument();
        expect(
            screen.getByText('You can cancel this order while it is still pending processing.'),
        ).toBeInTheDocument();
    });

    it('opens confirmation modal when cancel button is clicked', () => {
        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Order' }));

        expect(screen.getByText('Confirm Order Cancellation')).toBeInTheDocument();
        expect(
            screen.getByText(/Are you sure you want to cancel this order?/i),
        ).toBeInTheDocument();
    });

    it('closes confirmation modal when "Keep Order" is clicked', () => {
        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Order' }));
        expect(screen.getByText('Confirm Order Cancellation')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /keep order/i }));
        expect(screen.queryByText('Confirm Order Cancellation')).not.toBeInTheDocument();
    });

    it('handles successful order cancellation', async () => {
        mockCancelOrderAction.mockResolvedValueOnce({ success: true });

        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Order' }));
        fireEvent.click(screen.getByRole('button', { name: /yes, cancel order/i }));

        await waitFor(() => {
            expect(mockCancelOrderAction).toHaveBeenCalledWith('order-123');
            expect(mockRefresh).toHaveBeenCalledTimes(1);
        });
    });

    it('displays error message when cancellation fails', async () => {
        mockCancelOrderAction.mockResolvedValueOnce({
            success: false,
            error: 'Only pending orders can be cancelled.',
        });

        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Order' }));
        fireEvent.click(screen.getByRole('button', { name: /yes, cancel order/i }));

        await waitFor(() => {
            expect(screen.getByText('Only pending orders can be cancelled.')).toBeInTheDocument();
        });
    });

    it('displays fallback error message when cancellation fails without a specific error', async () => {
        mockCancelOrderAction.mockResolvedValueOnce({
            success: false,
            error: undefined,
        });

        render(
            <OrderCancelModal
                orderId="order-123"
                orderStatus="pending"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Order' }));
        fireEvent.click(screen.getByRole('button', { name: /yes, cancel order/i }));

        await waitFor(() => {
            expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
        });
    });
});
