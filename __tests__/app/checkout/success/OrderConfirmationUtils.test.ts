import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import {
    calculateOrderTotals,
    extractOrderStatuses,
    extractShippingAddress,
} from '@/app/checkout/success/OrderConfirmationUtils';
import { createMockBooksArray } from '@/utils/testing/mockBook';

describe('OrderConfirmationUtils', () => {
    const mockBooks = createMockBooksArray(2);

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
        stripe_coupon_id: null,
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
        stripe_coupon_id: null,
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
                        books: mockBooks[0],
                    },
                    {
                        id: 'item-2',
                        order_id: 'order-1',
                        book_id: 'book-2',
                        quantity: 1,
                        price: 10,
                        created_at: '2026-01-01T00:00:00Z',
                        books: mockBooks[1],
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
                discount_amount: 0,
                shipping_cost: 0,
                shipping_method_id: '',
                shipping_method_name: '',
                stripe_checkout_session_id: null,
                stripe_payment_intent_id: null,
                subtotal: 0,
                tax_amount: 0,
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
            expect(result.grandTotal).toBe(100);
        });

        it('handles null or undefined total_amount by defaulting to 0', () => {
            const mockOrder: OrderWithRelations = {
                id: 'order-null-total',
                user_id: 'user-1',
                status: 'PROCESSING',
                created_at: '2026-01-01T00:00:00Z',
                payment_method: 'card',
                total_amount: null as unknown as number,
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

            const result = calculateOrderTotals(mockOrder);
            expect(result.grandTotal).toBe(0);
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
                        books: mockBooks[0],
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
                            stripe_coupon_id: null,
                        },
                    },
                ],
                discount_amount: 0,
                shipping_cost: 0,
                shipping_method_id: '',
                shipping_method_name: '',
                stripe_checkout_session_id: null,
                stripe_payment_intent_id: null,
                subtotal: 0,
                tax_amount: 0,
            };

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(10);
            expect(result.evaluatedDiscounts[0].amount).toBe(10);
            expect(result.discountTotal).toBe(10);
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
                discount_amount: 0,
                shipping_cost: 0,
                shipping_method_id: '',
                shipping_method_name: '',
                stripe_checkout_session_id: null,
                stripe_payment_intent_id: null,
                subtotal: 0,
                tax_amount: 0,
            };

            const result = calculateOrderTotals(mockOrder);

            expect(result.subtotal).toBe(0);
            expect(result.totalItemCount).toBe(2);
            expect(result.evaluatedDiscounts).toEqual([]);
            expect(result.discountTotal).toBe(0);
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
        });
    });

    describe('extractShippingAddress', () => {
        it('extracts primary shipping fields correctly when order_addresses exists', () => {
            const mockOrder = {
                id: 'order-1',
                order_addresses: [
                    {
                        first_name: 'Jane',
                        last_name: 'Doe',
                        street_address: '123 Main St',
                        city: 'London',
                        postcode: 'SW1A 1AA',
                        country: 'United Kingdom',
                    },
                ],
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('Jane Doe');
            expect(result.addressLines).toEqual([
                '123 Main St',
                'London, SW1A 1AA',
                'United Kingdom',
            ]);
        });

        it('falls back to "Valued Customer" when first_name and last_name are empty', () => {
            const mockOrder = {
                id: 'order-address-empty',
                order_addresses: [
                    {
                        first_name: '',
                        last_name: '',
                        street_address: '123 Main St',
                        city: 'London',
                        postcode: 'SW1A 1AA',
                        country: 'United Kingdom',
                    },
                ],
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);
            expect(result.recipientName).toBe('Valued Customer');
        });

        it('uses default "Valued Customer" and empty address lines when no order_addresses exist', () => {
            const mockOrder = {
                id: 'order-4',
                order_addresses: [],
            } as unknown as OrderWithRelations;

            const result = extractShippingAddress(mockOrder);

            expect(result.recipientName).toBe('Valued Customer');
            expect(result.addressLines).toEqual([]);
        });
    });

    describe('extractOrderStatuses', () => {
        it('extracts payment and fulfillment status from fields', () => {
            const mockOrder = {
                id: 'order-1',
                status: 'DELIVERED',
                payment_status: 'succeeded',
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.paymentStatus).toBe('SUCCEEDED');
            expect(result.fulfillmentStatus).toBe('DELIVERED');
        });

        it('falls back to fulfillment_status when order.status is missing', () => {
            const mockOrder = {
                id: 'order-fulfillment-1',
                status: null,
                fulfillment_status: 'shipped',
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.fulfillmentStatus).toBe('SHIPPED');
        });

        it('falls back to "PROCESSING" when both status and fulfillment_status are missing', () => {
            const mockOrder = {
                id: 'order-fulfillment-2',
                status: null,
                fulfillment_status: null,
            } as unknown as OrderWithRelations;

            const result = extractOrderStatuses(mockOrder);

            expect(result.fulfillmentStatus).toBe('PROCESSING');
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
