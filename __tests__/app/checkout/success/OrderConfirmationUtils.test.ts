import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { SHIPPING_COST } from '@/data/checkout/CheckoutConstants';
import {
    calculateOrderTotals,
    extractOrderStatuses,
    extractShippingAddress,
} from '@/app/checkout/success/OrderConfirmationUtils';

describe('OrderConfirmationUtils', () => {
    const mockBook1 = {
        id: 'book-1',
        title: 'Book One',
        author: 'Author One',
        created_at: '2026-01-01T00:00:00Z',
        description: 'Description 1',
        format: 'Paperback',
        genre: 'Fiction',
        image_url: 'https://example.com/book1.jpg',
        is_active: true,
        page_count: 200,
        price: '20.00',
        publication_date: '2026-01-01',
        publisher: 'Publisher 1',
        sales_count: 50,
        stock_quantity: 20,
        updated_at: '2026-01-01T00:00:00Z',
    };

    const mockBook2 = {
        id: 'book-2',
        title: 'Book Two',
        author: 'Author Two',
        created_at: '2026-01-01T00:00:00Z',
        description: 'Description 2',
        format: 'Hardcover',
        genre: 'Non-Fiction',
        image_url: 'https://example.com/book2.jpg',
        is_active: true,
        page_count: 150,
        price: '10.00',
        publication_date: '2026-01-01',
        publisher: 'Publisher 2',
        sales_count: 30,
        stock_quantity: 15,
        updated_at: '2026-01-01T00:00:00Z',
    };

    const mockDiscountPercentage = {
        id: 'disc-1',
        code: 'TENOFF',
        type: 'percentage',
        value: 10,
        minimum_subtotal: null,
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2026-12-31T00:00:00Z',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
    };

    const mockDiscountFixed = {
        id: 'disc-2',
        code: 'FIVEFIXED',
        type: 'fixed_amount',
        value: 5,
        minimum_subtotal: null,
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2026-12-31T00:00:00Z',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
    };

    describe('calculateOrderTotals', () => {
        it('calculates totals correctly with items, percentage discounts, and fixed discounts', () => {
            const mockOrder: OrderWithRelations = {
                id: 'order-1',
                user_id: 'user-1',
                status: 'PROCESSING',
                created_at: '2026-01-01T00:00:00Z',
                payment_method: 'card',
                total_amount: 100,
                order_items: [
                    {
                        id: 'item-1',
                        order_id: 'order-1',
                        book_id: 'book-1',
                        quantity: 2,
                        price: 20,
                        created_at: '2026-01-01T00:00:00Z',
                        books: mockBook1,
                    },
                    {
                        id: 'item-2',
                        order_id: 'order-1',
                        book_id: 'book-2',
                        quantity: 1,
                        price: 10,
                        created_at: '2026-01-01T00:00:00Z',
                        books: mockBook2,
                    },
                ],
                order_discounts: [
                    {
                        discounts: mockDiscountPercentage,
                    },
                    {
                        discounts: mockDiscountFixed,
                    },
                ],
            };

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(50);
            expect(result.totalItemCount).toBe(3);
            expect(result.evaluatedDiscounts).toHaveLength(2);
            expect(result.evaluatedDiscounts[0]).toEqual({
                id: 'disc-1',
                code: 'TENOFF',
                amount: 5,
            });
            expect(result.evaluatedDiscounts[1]).toEqual({
                id: 'disc-2',
                code: 'FIVEFIXED',
                amount: 5,
            });
            expect(result.discountTotal).toBe(10);
            expect(result.shippingCost).toBe(SHIPPING_COST);
            expect(result.grandTotal).toBe(50 + SHIPPING_COST - 10);
        });

        it('caps fixed discount deduction to subtotal when discount exceeds subtotal', () => {
            const mockOrder: OrderWithRelations = {
                id: 'order-2',
                user_id: 'user-1',
                status: 'PROCESSING',
                created_at: '2026-01-01T00:00:00Z',
                payment_method: 'card',
                total_amount: 10,
                order_items: [
                    {
                        id: 'item-1',
                        order_id: 'order-2',
                        book_id: 'book-1',
                        quantity: 1,
                        price: 10,
                        created_at: '2026-01-01T00:00:00Z',
                        books: mockBook1,
                    },
                ],
                order_discounts: [
                    {
                        discounts: {
                            id: 'disc-1',
                            code: 'BIGDISCOUNT',
                            type: 'fixed_amount',
                            value: 50,
                            minimum_subtotal: null,
                            start_date: '2026-01-01T00:00:00Z',
                            end_date: '2026-12-31T00:00:00Z',
                            is_active: true,
                            created_at: '2026-01-01T00:00:00Z',
                            updated_at: '2026-01-01T00:00:00Z',
                        },
                    },
                ],
            };

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(10);
            expect(result.evaluatedDiscounts[0].amount).toBe(10);
            expect(result.discountTotal).toBe(10);
            expect(result.grandTotal).toBe(SHIPPING_COST);
        });

        it('handles missing order items, null price, and missing discounts gracefully', () => {
            const mockOrder: OrderWithRelations = {
                id: 'order-3',
                user_id: 'user-1',
                status: 'PROCESSING',
                created_at: '2026-01-01T00:00:00Z',
                payment_method: 'card',
                total_amount: 0,
                order_items: [
                    {
                        id: 'item-1',
                        order_id: 'order-3',
                        book_id: 'book-1',
                        quantity: 2,
                        price: null as unknown as number,
                        created_at: '2026-01-01T00:00:00Z',
                        books: null,
                    },
                ],
                order_discounts: [
                    {
                        discounts: null,
                    },
                ],
            };

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(0);
            expect(result.totalItemCount).toBe(2);
            expect(result.evaluatedDiscounts).toEqual([]);
            expect(result.discountTotal).toBe(0);
            expect(result.grandTotal).toBe(SHIPPING_COST);
        });

        it('handles completely null or undefined order_items and order_discounts arrays', () => {
            const mockOrder = {
                id: 'order-4',
                user_id: 'user-1',
                status: 'PROCESSING',
                created_at: '2026-01-01T00:00:00Z',
                payment_method: 'card',
                total_amount: 0,
                order_items: null,
                order_discounts: null,
            } as unknown as OrderWithRelations;

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(0);
            expect(result.totalItemCount).toBe(0);
            expect(result.evaluatedDiscounts).toEqual([]);
            expect(result.discountTotal).toBe(0);
            expect(result.grandTotal).toBe(SHIPPING_COST);
        });
    });

    describe('extractShippingAddress', () => {
        it('extracts primary shipping fields correctly', () => {
            const mockOrder = {
                id: 'order-1',
                shipping_name: 'Jane Doe',
                shipping_address_line1: '123 Main St',
                shipping_address_line2: 'Apt 4B',
                shipping_city: 'London',
                shipping_postal_code: 'SW1A 1AA',
                shipping_country: 'United Kingdom',
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('Jane Doe');
            expect(result.addressLines).toEqual([
                '123 Main St',
                'Apt 4B',
                'London, SW1A 1AA',
                'United Kingdom',
            ]);
        });

        it('falls back to secondary address fields when primary ones are absent', () => {
            const mockOrder = {
                id: 'order-2',
                full_name: 'John Smith',
                shipping_address: '456 High St',
                city: 'Manchester',
                postal_code: 'M1 1AA',
                country: 'United Kingdom',
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('John Smith');
            expect(result.addressLines).toEqual([
                '456 High St',
                'Manchester, M1 1AA',
                'United Kingdom',
            ]);
        });

        it('falls back to tertiary address fields and handles missing fields', () => {
            const mockOrder = {
                id: 'order-3',
                name: 'Alice Brown',
                address: '789 Park Ave',
                zip: '90210',
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('Alice Brown');
            expect(result.addressLines).toEqual(['789 Park Ave', '90210']);
        });

        it('uses default "Valued Customer" and empty address lines when no metadata exists', () => {
            const mockOrder = {
                id: 'order-4',
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('Valued Customer');
            expect(result.addressLines).toEqual([]);
        });
    });

    describe('extractOrderStatuses', () => {
        it('extracts payment and fulfillment status from primary fields', () => {
            const mockOrder = {
                id: 'order-1',
                status: 'DELIVERED',
                payment_status: 'succeeded',
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.paymentStatus).toBe('SUCCEEDED');
            expect(result.fulfillmentStatus).toBe('DELIVERED');
        });

        it('falls back to secondary status fields when primary fields are absent', () => {
            const mockOrder = {
                id: 'order-2',
                payment_state: 'completed',
                fulfillment_status: 'shipped',
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.paymentStatus).toBe('COMPLETED');
            expect(result.fulfillmentStatus).toBe('SHIPPED');
        });

        it('uses default "PAID" and "PROCESSING" when status fields are missing', () => {
            const mockOrder = {
                id: 'order-3',
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.paymentStatus).toBe('PAID');
            expect(result.fulfillmentStatus).toBe('PROCESSING');
        });
    });
});
