/**
 * @jest-environment node
 */

import {
    calculateSubtotal,
    calculateDiscount,
    calculateShipping,
    calculateTotals,
    formatCurrency,
    generateIdempotencyKey,
} from '@/data/checkout/CheckoutUtils';
import { AppliedDiscountState, CartCheckoutItem } from '@/data/checkout/CheckoutTypes';
import { createPaymentIntentAction, stripe } from '@/data/checkout/CheckoutStripeServer';

jest.mock('@/data/checkout/CheckoutConstants', () => ({
    DEFAULT_CURRENCY: 'GBP',
    FREE_SHIPPING_THRESHOLD: 50,
    SHIPPING_COST: 5.99,
    STRIPE_API_VERSION: '2025-08-27.acacia',
}));

jest.mock('stripe', () => {
    const MockStripe = jest.fn().mockImplementation(() => ({
        paymentIntents: {
            create: jest.fn(),
        },
    }));

    return Object.assign(MockStripe, {
        createFetchHttpClient: jest.fn(),
        createNodeHttpClient: jest.fn(),
    });
});

describe('CheckoutUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateSubtotal', () => {
        it('should return 0 when items array is empty', () => {
            const subtotal = calculateSubtotal([]);
            expect(subtotal).toBe(0);
        });

        it('should correctly calculate subtotal for valid cart items', () => {
            const items = [
                { price: 10.5, quantity: 2 },
                { price: 5.0, quantity: 3 },
            ] as unknown as CartCheckoutItem[];

            const subtotal = calculateSubtotal(items);
            expect(subtotal).toBe(36.0);
        });

        it('should handle non-numeric or missing price and quantity values by falling back to 0', () => {
            const items = [
                { price: 'invalid', quantity: 2 },
                { price: 10, quantity: null },
                { price: undefined, quantity: undefined },
            ] as unknown as CartCheckoutItem[];

            const subtotal = calculateSubtotal(items);
            expect(subtotal).toBe(0);
        });
    });

    describe('calculateDiscount', () => {
        it('should return 0 when discount state is null', () => {
            const discount = calculateDiscount(100, null);
            expect(discount).toBe(0);
        });

        it('should return 0 when subtotal is less than minimumSubtotal threshold', () => {
            const discountState: AppliedDiscountState = {
                code: 'SAVE10',
                discountPercent: 10,
                discountAmount: 0,
                minimumSubtotal: 50,
            };

            const discount = calculateDiscount(40, discountState);
            expect(discount).toBe(0);
        });

        it('should calculate percentage discount correctly and round to 2 decimal places', () => {
            const discountState: AppliedDiscountState = {
                code: 'SAVE15',
                discountPercent: 15,
                discountAmount: 0,
                minimumSubtotal: 20,
            };

            const discount = calculateDiscount(33.33, discountState);
            expect(discount).toBe(5.0);
        });

        it('should calculate fixed amount discount correctly when discountPercent is 0', () => {
            const discountState: AppliedDiscountState = {
                code: 'FLAT10',
                discountPercent: 0,
                discountAmount: 10,
                minimumSubtotal: null,
            };

            const discount = calculateDiscount(50, discountState);
            expect(discount).toBe(10);
        });

        it('should cap fixed amount discount at subtotal if discount exceeds subtotal', () => {
            const discountState: AppliedDiscountState = {
                code: 'FLAT100',
                discountPercent: 0,
                discountAmount: 100,
                minimumSubtotal: null,
            };

            const discount = calculateDiscount(40, discountState);
            expect(discount).toBe(40);
        });
    });

    describe('calculateShipping', () => {
        it('should return 0 when subtotal is 0', () => {
            const shipping = calculateShipping(0);
            expect(shipping).toBe(0);
        });

        it('should return SHIPPING_COST when subtotal is less than FREE_SHIPPING_THRESHOLD', () => {
            const shipping = calculateShipping(49.99);
            expect(shipping).toBe(5.99);
        });

        it('should return 0 when subtotal meets or exceeds FREE_SHIPPING_THRESHOLD', () => {
            const shippingThreshold = calculateShipping(50.0);
            expect(shippingThreshold).toBe(0);

            const shippingAbove = calculateShipping(100.0);
            expect(shippingAbove).toBe(0);
        });
    });

    describe('calculateTotals', () => {
        it('should calculate totals without discount and zero tax rate', () => {
            const items = [{ price: 20.0, quantity: 2 }] as unknown as CartCheckoutItem[];

            const totals = calculateTotals(items, null);

            expect(totals).toEqual({
                subtotal: 40.0,
                discountAmount: 0,
                shippingCost: 5.99,
                taxAmount: 0,
                grandTotal: 45.99,
            });
        });

        it('should calculate totals with percentage discount, shipping threshold met, and tax rate', () => {
            const items = [{ price: 50.0, quantity: 2 }] as unknown as CartCheckoutItem[];

            const discountState: AppliedDiscountState = {
                code: 'PERCENT20',
                discountPercent: 20,
                discountAmount: 0,
                minimumSubtotal: 50,
            };

            const totals = calculateTotals(items, discountState, 0.2);

            expect(totals).toEqual({
                subtotal: 100.0,
                discountAmount: 20.0,
                shippingCost: 0,
                taxAmount: 16.0,
                grandTotal: 96.0,
            });
        });
    });

    describe('formatCurrency', () => {
        it('should format amount using default currency (GBP)', () => {
            const formatted = formatCurrency(45.99);
            expect(formatted).toMatch(/£45\.99/);
        });

        it('should format amount using custom passed currency (USD)', () => {
            const formatted = formatCurrency(45.99, 'USD');
            expect(formatted).toMatch(/\$45\.99|USD/);
        });
    });

    describe('generateIdempotencyKey', () => {
        const originalCrypto = global.crypto;

        afterEach(() => {
            Object.defineProperty(global, 'crypto', {
                value: originalCrypto,
                writable: true,
                configurable: true,
            });
        });

        it('should use crypto.randomUUID when native crypto API is available', () => {
            const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
            const mockRandomUUID = jest.fn().mockReturnValue(mockUUID);

            Object.defineProperty(global, 'crypto', {
                value: { randomUUID: mockRandomUUID },
                writable: true,
                configurable: true,
            });

            const key = generateIdempotencyKey();
            expect(key).toBe(mockUUID);
            expect(mockRandomUUID).toHaveBeenCalledTimes(1);
        });

        it('should fallback to custom UUID generator when crypto API is unavailable', () => {
            Object.defineProperty(global, 'crypto', {
                value: undefined,
                writable: true,
                configurable: true,
            });

            const key = generateIdempotencyKey();
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(key).toMatch(uuidRegex);
        });
    });

    describe('createPaymentIntentAction', () => {
        it('should create PaymentIntent successfully and return secrets', async () => {
            const mockCreate = jest.fn().mockResolvedValue({
                id: 'pi_test_123',
                client_secret: 'pi_test_123_secret',
            });
            stripe.paymentIntents.create = mockCreate;

            const idempotencyKey = 'test-idempotency-key';
            const result = await createPaymentIntentAction(4599, idempotencyKey, 'GBP');

            expect(mockCreate).toHaveBeenCalledWith(
                {
                    amount: 4599,
                    currency: 'gbp',
                    customer: undefined,
                    automatic_payment_methods: { enabled: true },
                    metadata: {},
                },
                { idempotencyKey: 'test-idempotency-key' },
            );

            expect(result).toEqual({
                success: true,
                clientSecret: 'pi_test_123_secret',
                paymentIntentId: 'pi_test_123',
                error: null,
            });
        });

        it('should handle Stripe API errors gracefully when error instance is thrown', async () => {
            const mockCreate = jest.fn().mockRejectedValue(new Error('Card declined'));
            stripe.paymentIntents.create = mockCreate;

            const result = await createPaymentIntentAction(5000, 'fail-key');

            expect(result).toEqual({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Card declined',
            });
        });

        it('should fallback to default error message when non-Error object is thrown', async () => {
            const mockCreate = jest.fn().mockRejectedValue('String error rejection');
            stripe.paymentIntents.create = mockCreate;

            const result = await createPaymentIntentAction(5000, 'fail-key-string');

            expect(result).toEqual({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Failed to initialize payment gateway.',
            });
        });
    });
});
