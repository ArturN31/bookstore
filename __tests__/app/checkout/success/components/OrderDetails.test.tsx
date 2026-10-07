import { render, screen } from '@testing-library/react';
import { OrderWithRelations, OrderItemWithBook } from '@/data/checkout/CheckoutTypes';
import { OrderDetails } from '@/app/checkout/success/components/OrderDetails';
import { createMockBook } from '@/utils/testing/mockBook';

jest.mock('@/app/checkout/success/components/DeliveryAddressCard', () => ({
    DeliveryAddressCard: ({
        recipientName,
        addressLines,
    }: {
        readonly recipientName: string;
        readonly addressLines: readonly string[];
    }) => (
        <div data-testid="delivery-address-card">
            <span data-testid="recipient-name">{recipientName}</span>
            <span data-testid="address-lines">{addressLines.join(', ')}</span>
        </div>
    ),
}));

jest.mock('@/app/checkout/success/components/OrderStatusCard', () => ({
    OrderStatusCard: ({
        paymentStatus,
        fulfillmentStatus,
    }: {
        readonly paymentStatus: string;
        readonly fulfillmentStatus: string;
    }) => (
        <div data-testid="order-status-card">
            <span data-testid="payment-status">{paymentStatus}</span>
            <span data-testid="fulfillment-status">{fulfillmentStatus}</span>
        </div>
    ),
}));

jest.mock('@/app/checkout/success/components/ItemizedBooksLedger', () => ({
    ItemizedBooksLedger: ({
        totalItemCount,
    }: {
        readonly items: readonly unknown[];
        readonly totalItemCount: number;
    }) => (
        <div data-testid="itemized-books-ledger">
            <span data-testid="total-item-count">{totalItemCount}</span>
        </div>
    ),
}));

jest.mock('@/app/checkout/success/components/SettlementSummaryCard', () => ({
    SettlementSummaryCard: ({ totals }: { readonly totals: { readonly totalAmount: number } }) => (
        <div data-testid="settlement-summary-card">
            <span data-testid="total-amount">{totals.totalAmount}</span>
        </div>
    ),
}));

describe('OrderDetails Component', () => {
    it('renders all order detail sections correctly with valid order data', () => {
        const mockBook = createMockBook({ title: 'Clean Code' });

        const mockOrder: OrderWithRelations = {
            id: 'ORD-12345',
            user_id: 'user-1',
            status: 'PROCESSING',
            created_at: '2026-01-01T00:00:00Z',
            payment_method: 'card',
            total_amount: 39.99,
            order_items: [
                {
                    id: 'item-1',
                    order_id: 'ORD-12345',
                    book_id: 'book-1',
                    quantity: 1,
                    price: 35.0,
                    created_at: '2026-01-01T00:00:00Z',
                    books: mockBook,
                },
            ],
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

        render(<OrderDetails order={mockOrder} />);

        expect(screen.getByTestId('delivery-address-card')).toBeInTheDocument();
        expect(screen.getByTestId('order-status-card')).toBeInTheDocument();
        expect(screen.getByTestId('itemized-books-ledger')).toBeInTheDocument();
        expect(screen.getByTestId('settlement-summary-card')).toBeInTheDocument();
    });

    it('handles undefined order items gracefully by falling back to an empty collection', () => {
        const mockOrderWithoutItems: OrderWithRelations = {
            id: 'ORD-12345',
            user_id: 'user-1',
            status: 'PROCESSING',
            created_at: '2026-01-01T00:00:00Z',
            payment_method: 'card',
            total_amount: 39.99,
            order_items: undefined as unknown as readonly OrderItemWithBook[],
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

        render(<OrderDetails order={mockOrderWithoutItems} />);

        expect(screen.getByTestId('itemized-books-ledger')).toBeInTheDocument();
        expect(screen.getByTestId('total-item-count')).toHaveTextContent('0');
    });
});
