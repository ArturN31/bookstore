import { render, screen } from '@testing-library/react';
import { OrderConfirmationSummary } from '@/app/checkout/success/components/OrderConfirmationSummary';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';

describe('OrderConfirmationSummary', () => {
    const mockBook = {
        id: 'book-1',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        created_at: '2026-01-01T00:00:00Z',
        description: 'A handbook of agile software craftsmanship.',
        format: 'Paperback',
        genre: 'Technology',
        image_url: 'https://example.com/cleancode.jpg',
        is_active: true,
        page_count: 464,
        price: '35.00',
        publication_date: '2008-08-01',
        publisher: 'Prentice Hall',
        sales_count: 500,
        stock_quantity: 40,
        updated_at: '2026-01-01T00:00:00Z',
    };

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
