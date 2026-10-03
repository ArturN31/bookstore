import { render, screen } from '@testing-library/react';
import { OrderConfirmationSummary } from '@/app/checkout/success/components/OrderConfirmationSummary';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { createMockBook } from '@/utils/testing/mockBook';

describe('OrderConfirmationSummary', () => {
    const mockBook = createMockBook();

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

    it('renders main section and delegates correctly to all subcomponents with order data', () => {
        render(<OrderConfirmationSummary order={mockOrder} />);

        expect(screen.getByText('Order Confirmed Successfully')).toBeInTheDocument();
        expect(screen.getByText('ORD-12345')).toBeInTheDocument();

        expect(screen.getByText('Delivery Address')).toBeInTheDocument();
        expect(screen.getByText('Valued Customer')).toBeInTheDocument();

        expect(screen.getByText('Status & Verification')).toBeInTheDocument();
        expect(screen.getByText('PAID')).toBeInTheDocument();
        expect(screen.getByText('PROCESSING')).toBeInTheDocument();

        expect(screen.getByText('Itemized Books Ledger')).toBeInTheDocument();
        expect(screen.getByText('Clean Code')).toBeInTheDocument();
        expect(screen.getByText('1 Items Total')).toBeInTheDocument();

        expect(screen.getByText('Settlement Summary')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /continue shopping/i })).toHaveAttribute(
            'href',
            '/catalog',
        );
    });
});
