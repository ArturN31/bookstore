import { render, screen } from '@testing-library/react';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { ItemizedBooksLedger } from '@/app/checkout/success/components/ItemizedBooksLedger';
import { createMockBook } from '@/utils/testing/mockBook';

describe('ItemizedBooksLedger', () => {
    const mockItems: OrderWithRelations['order_items'] = [
        {
            id: 'item-1',
            order_id: 'order-1',
            book_id: 'book-1',
            quantity: 2,
            price: 15.5,
            created_at: '2026-01-01T00:00:00Z',
            books: createMockBook(),
        },
        {
            id: 'item-2',
            order_id: 'order-1',
            book_id: 'book-2',
            quantity: 1,
            price: 9.99,
            created_at: '2026-01-01T00:00:00Z',
            books: null,
        },
    ];

    it('renders itemized book titles, quantities, total item count, and item total price', () => {
        render(
            <ItemizedBooksLedger
                items={mockItems}
                totalItemCount={3}
            />,
        );

        expect(screen.getByText('Itemized Books Ledger')).toBeInTheDocument();
        expect(screen.getByText('3 Items Total')).toBeInTheDocument();

        expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
        expect(screen.getByText('£31.00')).toBeInTheDocument();

        expect(screen.getByText('Book Item')).toBeInTheDocument();
        expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
        expect(screen.getByText('£9.99')).toBeInTheDocument();
    });

    it('renders safely when items prop is null', () => {
        render(
            <ItemizedBooksLedger
                items={null}
                totalItemCount={0}
            />,
        );

        expect(screen.getByText('0 Items Total')).toBeInTheDocument();
    });

    it('defaults item price to 0 when item.price is null or undefined', () => {
        const itemWithNullPrice: OrderWithRelations['order_items'] = [
            {
                id: 'item-3',
                order_id: 'order-1',
                book_id: 'book-3',
                quantity: 3,
                price: null as unknown as number,
                created_at: '2026-01-01T00:00:00Z',
                books: null,
            },
        ];

        render(
            <ItemizedBooksLedger
                items={itemWithNullPrice}
                totalItemCount={3}
            />,
        );

        expect(screen.getByText('Book Item')).toBeInTheDocument();
        expect(screen.getByText('Quantity: 3')).toBeInTheDocument();
        expect(screen.getByText('£0.00')).toBeInTheDocument();
    });
});
