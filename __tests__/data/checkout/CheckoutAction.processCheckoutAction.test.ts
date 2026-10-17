/**
 * @jest-environment node
 */

import {
    processCheckoutAction,
    ProcessCheckoutActionPayload,
} from '@/data/checkout/CheckoutAction';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';
import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import { executeCheckoutOrder } from '@/data/checkout/services/CheckoutService';
import { getActiveCartCheckoutItems } from '@/data/checkout/services/CheckoutCartService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { checkoutFormSchema, serverCheckoutPayloadSchema } from '@/data/schemas/checkoutSchema';
import { getAppClientIp } from '@/utils/network/getAppClientIp';

jest.mock('@/utils/network/rateLimiter', () => ({
    buildRateLimitIdentifiers: (ip: string, userId?: string | null) =>
        userId ? [`user:${userId}`, `ip:${ip}`] : [`ip:${ip}`],
    limiters: {
        discount: {},
        checkout: {},
    },
    verifyRateLimit: jest.fn(),
}));
jest.mock('@/utils/network/getAppClientIp', () => ({
    getAppClientIp: jest.fn().mockResolvedValue('203.0.113.1'),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/services/CheckoutUserService');
jest.mock('@/data/checkout/services/CheckoutService');
jest.mock('@/data/checkout/services/CheckoutCartService');

jest.mock('@/data/checkout/CheckoutUtils', () => ({
    stripe: {
        paymentIntents: {
            create: jest.fn(),
        },
        customers: {
            create: jest.fn(),
        },
    },
    createPaymentIntentAction: jest.fn(),
    calculateTotals: jest.fn(),
}));

jest.mock('@/data/schemas/checkoutSchema', () => ({
    checkoutFormSchema: {
        safeParse: jest.fn(),
    },
    applyDiscountSchema: {
        safeParse: jest.fn(),
    },
    serverCheckoutPayloadSchema: {
        safeParse: jest.fn(),
    },
}));

describe('processCheckoutAction', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, STRIPE_SECRET_KEY: 'sk_test_123' };
        jest.mocked(getAppClientIp).mockResolvedValue('203.0.113.1');
        jest.mocked(verifyRateLimit).mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
        });

        jest.mocked(serverCheckoutPayloadSchema.safeParse).mockReturnValue({
            success: true,
            data: {
                shippingDetails: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    streetAddress: '123 Main St',
                    city: 'Glasgow',
                    postcode: 'G1 1AA',
                    country: 'United Kingdom',
                    phoneNumber: '01234567890',
                    paymentMethod: 'card',
                },
                discountId: 'disc-10',
                shippingMethodId: 'royal_mail_standard',
                idempotencyKey: 'idemp-xyz-123',
            },
        } as never);

        jest.mocked(getActiveCartCheckoutItems).mockResolvedValue({
            data: [{ id: 'book-1', quantity: 2 }],
            error: null,
        } as never);

        jest.mocked(sanitizeSupabaseError).mockImplementation((err: unknown) =>
            typeof err === 'string' ? err : 'Sanitized error message',
        );
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const mockPayload: ProcessCheckoutActionPayload = {
        shippingDetails: {
            firstName: 'Jane',
            lastName: 'Doe',
            streetAddress: '123 Main St',
            city: 'Glasgow',
            postcode: 'G1 1AA',
            country: 'United Kingdom',
            phoneNumber: '01234567890',
            paymentMethod: 'card',
        },
        discountId: 'disc-10',
        shippingMethodId: 'royal_mail_standard',
        idempotencyKey: 'idemp-xyz-123',
    };

    it('should return error if STRIPE_SECRET_KEY is missing', async () => {
        delete process.env.STRIPE_SECRET_KEY;

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Stripe configuration is missing on the server.',
        });
    });

    it('should successfully execute checkout order when cart is found', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: 'cus_777',
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
            success: true,
            data: {
                firstName: 'Jane',
                lastName: 'Doe',
                streetAddress: '123 Main St',
                city: 'Glasgow',
                postcode: 'G1 1AA',
                country: 'United Kingdom',
                phoneNumber: '01234567890',
                paymentMethod: 'card',
            },
        } as never);

        const mockProcessResult = {
            success: true,
            orderId: 'order-777',
            clientSecret: 'pi_secret_123',
            paymentIntentId: 'pi_123',
            error: null,
        };

        jest.mocked(executeCheckoutOrder).mockResolvedValue({
            data: mockProcessResult,
            error: null,
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: true,
            data: mockProcessResult,
        });
        expect(verifyRateLimit).toHaveBeenNthCalledWith(1, {
            identifier: 'ip:203.0.113.1',
            limiter: limiters.checkout,
            failClosed: true,
        });
        expect(verifyRateLimit).toHaveBeenNthCalledWith(2, {
            identifier: 'user:user-123',
            limiter: limiters.checkout,
            failClosed: true,
        });
        expect(executeCheckoutOrder).toHaveBeenCalledWith({
            userId: 'user-123',
            customerEmail: 'jane@example.com',
            stripeCustomerId: 'cus_777',
            items: [{ bookId: 'book-1', quantity: 2 }],
            discountId: 'disc-10',
            paymentMethod: 'card',
            shippingMethodId: 'royal_mail_standard',
            idempotencyKey: 'idemp-xyz-123',
            shippingAddress: {
                firstName: 'Jane',
                lastName: 'Doe',
                streetAddress: '123 Main St',
                city: 'Glasgow',
                postcode: 'G1 1AA',
                country: 'United Kingdom',
                phoneNumber: '01234567890',
            },
        });
        expect(getActiveCartCheckoutItems).toHaveBeenCalledWith('user-123');
    });

    it('should return error when getActiveCartCheckoutItems returns null data', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: 'cus_777',
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
            success: true,
            data: {
                firstName: 'Jane',
                lastName: 'Doe',
                streetAddress: '123 Main St',
                city: 'Glasgow',
                postcode: 'G1 1AA',
                country: 'United Kingdom',
                phoneNumber: '01234567890',
                paymentMethod: 'card',
            },
        } as never);

        jest.mocked(getActiveCartCheckoutItems).mockResolvedValue({
            data: null,
            error: null,
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT,
        });
        expect(getActiveCartCheckoutItems).toHaveBeenCalledWith('user-123');
        expect(executeCheckoutOrder).not.toHaveBeenCalled();
    });

    it('should return CHECKOUT_LOGIN_REQUIRED when user is not logged in', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: null,
            error: 'User unauthenticated',
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
        });
    });

    it('should return CHECKOUT_LOGIN_REQUIRED when user id is missing', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: { id: '', email: '', profile: null, stripeCustomerId: null },
            error: null,
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
        });
    });

    it('should return rate limit error when user exceeds checkout attempt limit', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit)
            .mockReturnValueOnce({ success: true } as never)
            .mockReturnValueOnce({ success: false } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Too many checkout attempts. Please wait a moment.',
        });
    });

    it('should rate limit the client IP before looking up the checkout user', async () => {
        jest.mocked(verifyRateLimit).mockReturnValue({ success: false } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Too many checkout attempts. Please wait a moment.',
        });
        expect(getCurrentUserCheckoutData).not.toHaveBeenCalled();
        expect(verifyRateLimit).toHaveBeenCalledWith({
            identifier: 'ip:203.0.113.1',
            limiter: limiters.checkout,
            failClosed: true,
        });
    });

    it('should return schema error when checkout form details are invalid', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(serverCheckoutPayloadSchema.safeParse).mockReturnValue({
            success: false,
            error: {
                issues: [{ message: 'First name must be at least 2 characters.' }],
            },
        } as never);

        const result = await processCheckoutAction({
            ...mockPayload,
            shippingDetails: { firstName: 'A' },
        });

        expect(result).toEqual({
            success: false,
            error: 'First name must be at least 2 characters.',
        });
    });

    it('should fallback to default form error message when issues array is empty', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(serverCheckoutPayloadSchema.safeParse).mockReturnValue({
            success: false,
            error: { issues: [] },
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Invalid checkout payload entries.',
        });
    });

    it('should return error when executeCheckoutOrder fails with an error string', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
            success: true,
            data: { paymentMethod: 'card' },
        } as never);

        jest.mocked(executeCheckoutOrder).mockResolvedValue({
            data: null,
            error: 'Insufficient stock for selected books.',
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Insufficient stock for selected books.',
        });
    });

    it('should fallback to ORDER_CREATION_FAILED when executeCheckoutOrder returns null data and null error', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'jane@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
            success: true,
            data: { paymentMethod: 'card' },
        } as never);

        jest.mocked(executeCheckoutOrder).mockResolvedValue({
            data: null,
            error: null,
        } as never);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
        });
    });

    it('should catch thrown exception in processCheckoutAction and return sanitized error', async () => {
        const thrownError = new Error('Unexpected execution failure');
        jest.mocked(getCurrentUserCheckoutData).mockRejectedValueOnce(thrownError);

        const result = await processCheckoutAction(mockPayload);

        expect(result).toEqual({
            success: false,
            error: 'Sanitized error message',
        });
        expect(sanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
    });
});
