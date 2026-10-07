import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { JSX } from 'react';
import ViewOrderPage from '@/app/user/order/[orderId]/page';

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/data/checkout/services/OrderOwnershipService');

jest.mock('@/app/checkout/success/components/OrderDetails', () => ({
    OrderDetails: ({ order }: { readonly order: OrderWithRelations }): JSX.Element => (
        <div data-testid="order-details">Order Details: {order.id}</div>
    ),
}));

describe('ViewOrderPage', () => {
    const mockRedirect = jest.mocked(redirect);
    const mockVerifyOrderOwnershipAndFetch = jest.mocked(verifyOrderOwnershipAndFetch);

    const mockOrder: OrderWithRelations = {
        id: 'order-123',
        user_id: 'user-456',
        status: 'PROCESSING',
        created_at: '2026-01-01T00:00:00Z',
        payment_method: 'card',
        total_amount: 49.99,
        order_items: [],
        order_discounts: [],
        discount_amount: 0,
        shipping_cost: 0,
        shipping_method_id: '',
        shipping_method_name: '',
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        subtotal: 0,
        tax_amount: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders invalid order reference error state when params does not contain orderId', async () => {
        const pageComponent = await ViewOrderPage({
            params: Promise.resolve({ orderId: '' }),
        });

        render(pageComponent);

        expect(screen.getByText('Invalid Order Reference')).toBeInTheDocument();
        expect(
            screen.getByText('The order reference provided is invalid or missing.'),
        ).toBeInTheDocument();
    });

    it('renders invalid order reference error state when orderId is not a string', async () => {
        const pageComponent = await ViewOrderPage({
            params: Promise.resolve({
                orderId: 12345 as unknown as string,
            }),
        });

        render(pageComponent);

        expect(screen.getByText('Invalid Order Reference')).toBeInTheDocument();
        expect(
            screen.getByText('The order reference provided is invalid or missing.'),
        ).toBeInTheDocument();
    });

    it('renders order not found error state when verifyOrderOwnershipAndFetch returns NOT_FOUND', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'NOT_FOUND',
            order: null,
        });

        const pageComponent = await ViewOrderPage({
            params: Promise.resolve({ orderId: 'order-123' }),
        });

        render(pageComponent);

        expect(mockVerifyOrderOwnershipAndFetch).toHaveBeenCalledWith('order-123');
        expect(screen.getByText('Order Not Found')).toBeInTheDocument();
        expect(
            screen.getByText('The requested order could not be found or does not exist.'),
        ).toBeInTheDocument();
    });

    it('redirects to login page with encoded redirect URL when UNAUTHENTICATED', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'UNAUTHENTICATED',
            order: null,
        });

        await ViewOrderPage({
            params: Promise.resolve({ orderId: 'order-123' }),
        });

        expect(mockVerifyOrderOwnershipAndFetch).toHaveBeenCalledWith('order-123');
        expect(mockRedirect).toHaveBeenCalledWith('/login?redirect=/user/order/order-123');
    });

    it('renders access denied error state when user is UNAUTHORIZED', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'UNAUTHORIZED',
            order: null,
        });

        const pageComponent = await ViewOrderPage({
            params: Promise.resolve({ orderId: 'order-123' }),
        });

        render(pageComponent);

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(APP_ERROR_MESSAGES.UNAUTHORIZED_ORDER_ACCESS)).toBeInTheDocument();

        const storefrontButton = screen.getByRole('link', { name: 'Return to Storefront' });
        expect(storefrontButton).toBeInTheDocument();
        expect(storefrontButton).toHaveAttribute('href', '/');
    });

    it('renders OrderDetails component when status is SUCCESS', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'SUCCESS',
            order: mockOrder,
        });

        const pageComponent = await ViewOrderPage({
            params: Promise.resolve({ orderId: 'order-123' }),
        });

        render(pageComponent);

        expect(screen.getByTestId('order-details')).toBeInTheDocument();
        expect(screen.getByText('Order Details: order-123')).toBeInTheDocument();
    });
});
