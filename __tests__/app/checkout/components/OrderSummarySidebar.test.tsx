import { OrderSummarySidebar } from '@/app/checkout/components/OrderSummarySidebar';
import { render, screen } from '@testing-library/react';
import { CartItem } from '@/data/cart/CartMapper';
import { AppliedDiscountState } from '@/data/checkout/CheckoutTypes';

describe('OrderSummarySidebar', () => {
    const mockItems: readonly CartItem[] = [
        {
            id: 'book-1',
            title: 'The Great Gatsby',
            price: '15.00',
            quantity: 2,
            author: 'F. Scott Fitzgerald',
            created_at: '2026-01-01',
            description: 'A classic novel',
            format: 'Paperback',
            genre: 'Fiction',
            image_url: 'https://example.com/gatsby.jpg',
            is_active: true,
            page_count: 180,
            publication_date: '1925-04-10',
            publisher: 'Scribner',
            sales_count: 100,
            stock_quantity: 10,
            updated_at: '2026-01-01',
        },
        {
            id: 'book-2',
            title: '1984',
            price: '10.00',
            quantity: 1,
            author: 'George Orwell',
            created_at: '2026-01-01',
            description: 'Dystopian novel',
            format: 'Paperback',
            genre: 'Dystopian',
            image_url: 'https://example.com/1984.jpg',
            is_active: true,
            page_count: 328,
            publication_date: '1949-06-08',
            publisher: 'Secker & Warburg',
            sales_count: 200,
            stock_quantity: 5,
            updated_at: '2026-01-01',
        },
    ];

    const defaultTotals = {
        subtotal: 40.0,
        discountAmount: 0,
        shippingCost: 5.99,
        taxAmount: 0,
        grandTotal: 45.99,
    };

    const defaultProps = {
        initialItems: mockItems,
        totals: defaultTotals,
        appliedDiscount: null as AppliedDiscountState | null,
        isSubmitting: false,
        checkoutError: null as string | null,
    };

    it('renders order summary, cart items, subtotal, shipping, and total amount', () => {
        render(<OrderSummarySidebar {...defaultProps} />);

        expect(screen.getByText('Order Summary')).toBeInTheDocument();
        expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
        expect(screen.getByText('1984')).toBeInTheDocument();

        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('Grand Total')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pay £45\.99/i })).toBeInTheDocument();
    });

    it('shows amount needed for free shipping when subtotal is below threshold', () => {
        render(<OrderSummarySidebar {...defaultProps} />);

        expect(
            screen.getByText((content) => content.includes('more to qualify for')),
        ).toBeInTheDocument();
        expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    });

    it('shows qualify for free shipping message and FREE shipping text when subtotal reaches threshold', () => {
        const freeShippingTotals = {
            subtotal: 60.0,
            discountAmount: 0,
            shippingCost: 0,
            taxAmount: 0,
            grandTotal: 60.0,
        };

        render(
            <OrderSummarySidebar
                {...defaultProps}
                totals={freeShippingTotals}
            />,
        );

        expect(screen.getByText('You qualify for Free Shipping!')).toBeInTheDocument();
        expect(screen.getByText('FREE')).toBeInTheDocument();
    });

    it('renders discount breakdown when totals.discountAmount is greater than 0', () => {
        const discountTotals = {
            subtotal: 50.0,
            discountAmount: 10.0,
            shippingCost: 0,
            taxAmount: 0,
            grandTotal: 40.0,
        };

        const appliedDiscount: AppliedDiscountState = {
            code: 'SAVE10',
            discountAmount: 10.0,
            discountPercent: 10,
            minimumSubtotal: null,
        };

        render(
            <OrderSummarySidebar
                {...defaultProps}
                totals={discountTotals}
                appliedDiscount={appliedDiscount}
            />,
        );

        expect(screen.getByText('Discount (SAVE10)')).toBeInTheDocument();
        expect(screen.getByText('-£10.00')).toBeInTheDocument();
    });

    it('renders checkout error banner when checkoutError is provided', () => {
        render(
            <OrderSummarySidebar
                {...defaultProps}
                checkoutError="Payment authorization failed."
            />,
        );

        expect(screen.getByText('Payment authorization failed.')).toBeInTheDocument();
    });

    it('disables submit button and updates text when isSubmitting is true', () => {
        render(
            <OrderSummarySidebar
                {...defaultProps}
                isSubmitting={true}
            />,
        );

        const submitBtn = screen.getByRole('button', { name: /processing secure payment\.\.\./i });
        expect(submitBtn).toBeDisabled();
    });

    it('handles items with invalid or zero price fallback safely', () => {
        const itemWithInvalidPrice: readonly CartItem[] = [
            {
                id: 'item-invalid',
                title: 'Unpriced Book',
                price: 'invalid',
                quantity: 1,
                author: 'Unknown',
                created_at: '2026-01-01',
                description: 'No description',
                format: 'Paperback',
                genre: 'Unknown',
                image_url: 'https://example.com/unpriced.jpg',
                is_active: true,
                page_count: 100,
                publication_date: '2026-01-01',
                publisher: 'Self-published',
                sales_count: 0,
                stock_quantity: 10,
                updated_at: '2026-01-01',
            },
        ];

        render(
            <OrderSummarySidebar
                {...defaultProps}
                initialItems={itemWithInvalidPrice}
            />,
        );

        expect(screen.getByText('Unpriced Book')).toBeInTheDocument();
        expect(screen.getByText('£0.00')).toBeInTheDocument();
    });
});
