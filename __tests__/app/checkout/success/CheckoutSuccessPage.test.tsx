import { render, screen } from '@testing-library/react';
import CheckoutSuccessPage from '@/app/checkout/success/page';
import { notFound, redirect } from 'next/navigation';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { JSX } from 'react';

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    redirect: jest.fn(),
}));

jest.mock('@/data/checkout/services/OrderOwnershipService');

jest.mock('@/app/checkout/success/components/OrderConfirmationSummary', () => ({
    OrderConfirmationSummary: ({ order }: { readonly order: OrderWithRelations }): JSX.Element => (
        <div data-testid="order-confirmation-summary">Order Confirmation: {order.id}</div>
    ),
}));

describe('CheckoutSuccessPage', () => {
    const mockNotFound = jest.mocked(notFound);
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
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('triggers notFound when searchParams does not contain orderId', async () => {
        await expect(
            CheckoutSuccessPage({
                searchParams: Promise.resolve({}),
            }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it('triggers notFound when orderId is not a string', async () => {
        await expect(
            CheckoutSuccessPage({
                searchParams: Promise.resolve({
                    orderId: 12345 as unknown as string,
                }),
            }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it('triggers notFound when verifyOrderOwnershipAndFetch returns NOT_FOUND', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'NOT_FOUND',
            order: null,
        });

        await expect(
            CheckoutSuccessPage({
                searchParams: Promise.resolve({ orderId: 'order-123' }),
            }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(mockVerifyOrderOwnershipAndFetch).toHaveBeenCalledWith('order-123');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it('redirects to login page with encoded redirect URL when UNAUTHENTICATED', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'UNAUTHENTICATED',
            order: null,
        });

        await CheckoutSuccessPage({
            searchParams: Promise.resolve({ orderId: 'order-123' }),
        });

        expect(mockVerifyOrderOwnershipAndFetch).toHaveBeenCalledWith('order-123');
        expect(mockRedirect).toHaveBeenCalledWith(
            '/login?redirect=/checkout/success?orderId=order-123',
        );
    });

    it('renders access denied alert UI when user is UNAUTHORIZED', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'UNAUTHORIZED',
            order: null,
        });

        const pageComponent = await CheckoutSuccessPage({
            searchParams: Promise.resolve({ orderId: 'order-123' }),
        });

        render(pageComponent);

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(APP_ERROR_MESSAGES.UNAUTHORIZED_ORDER_ACCESS)).toBeInTheDocument();

        const storefrontButton = screen.getByRole('link', { name: 'Return to Storefront' });
        expect(storefrontButton).toBeInTheDocument();
        expect(storefrontButton).toHaveAttribute('href', '/catalog');
    });

    it('renders OrderConfirmationSummary component when status is SUCCESS', async () => {
        mockVerifyOrderOwnershipAndFetch.mockResolvedValueOnce({
            status: 'SUCCESS',
            order: mockOrder,
        });

        const pageComponent = await CheckoutSuccessPage({
            searchParams: Promise.resolve({ orderId: 'order-123' }),
        });

        render(pageComponent);

        expect(screen.getByTestId('order-confirmation-summary')).toBeInTheDocument();
        expect(screen.getByText('Order Confirmation: order-123')).toBeInTheDocument();
    });
});
