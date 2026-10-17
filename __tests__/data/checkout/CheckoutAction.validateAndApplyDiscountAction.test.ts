/**
 * @jest-environment node
 */

import { validateAndApplyDiscountAction } from '@/data/checkout/CheckoutAction';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';
import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import { validateAndCalculateDiscount } from '@/data/checkout/services/CheckoutDiscountService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { applyDiscountSchema } from '@/data/schemas/checkoutSchema';
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
jest.mock('@/data/checkout/services/CheckoutDiscountService');

jest.mock('@/data/schemas/checkoutSchema', () => ({
    applyDiscountSchema: {
        safeParse: jest.fn(),
    },
}));

describe('validateAndApplyDiscountAction', () => {
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

        jest.mocked(sanitizeSupabaseError).mockImplementation((err: unknown) =>
            typeof err === 'string' ? err : 'Sanitized error message',
        );
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    const mockCode = 'SAVE10';
    const mockSubtotal = 100;

    it('should successfully validate and apply a valid discount code', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: 'cus_123',
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: true,
            data: { code: 'SAVE10', subtotal: 100 },
        } as never);

        const mockAppliedDiscount = {
            id: 'disc-1',
            code: 'SAVE10',
            discountPercent: 10,
            discountAmount: 10,
            minimumSubtotal: null,
        };

        jest.mocked(validateAndCalculateDiscount).mockResolvedValue({
            data: mockAppliedDiscount,
            error: null,
        } as never);

        const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

        expect(result).toEqual({
            success: true,
            data: mockAppliedDiscount,
        });
        expect(verifyRateLimit).toHaveBeenCalledWith({
            identifier: 'ip:203.0.113.1',
            limiter: limiters.discount,
            failClosed: true,
        });
        expect(validateAndCalculateDiscount).toHaveBeenCalledWith('SAVE10', 100);
    });

    it('should apply the discount limit to the client IP', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: null,
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: true,
            data: { code: 'SAVE10', subtotal: 100 },
        } as never);

        jest.mocked(validateAndCalculateDiscount).mockResolvedValue({
            data: {
                id: 'disc-1',
                code: 'SAVE10',
                discountPercent: 10,
                discountAmount: 10,
                minimumSubtotal: null,
            },
            error: null,
        } as never);

        await validateAndApplyDiscountAction(mockCode, mockSubtotal);

        expect(verifyRateLimit).toHaveBeenCalledWith({
            identifier: 'ip:203.0.113.1',
            limiter: limiters.discount,
            failClosed: true,
        });
    });

    it('should return rate limit error when user exceeds rate limit', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: false } as never);

        const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: 'Too many discount verification attempts.',
        });
    });

    it('should return schema validation error when code or subtotal is invalid', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: false,
            error: {
                issues: [{ message: 'Discount code cannot be empty.' }],
            },
        } as never);

        const result = await validateAndApplyDiscountAction('', mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: 'Discount code cannot be empty.',
        });
    });

    it('should fallback to INVALID_DISCOUNT_CODE when schema parse issues array is empty', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: false,
            error: { issues: [] },
        } as never);

        const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
        });
    });

    it('should return discount validation error when validateAndCalculateDiscount fails', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: true,
            data: { code: 'EXPIRED10', subtotal: 100 },
        } as never);

        jest.mocked(validateAndCalculateDiscount).mockResolvedValue({
            data: null,
            error: 'This discount code has expired.',
        } as never);

        const result = await validateAndApplyDiscountAction('EXPIRED10', mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: 'This discount code has expired.',
        });
    });

    it('should fallback to INVALID_DISCOUNT_CODE when discount result error and data are both null', async () => {
        jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
            data: {
                id: 'user-123',
                email: 'user@example.com',
                profile: null,
                stripeCustomerId: null,
            },
            error: null,
        } as never);

        jest.mocked(verifyRateLimit).mockReturnValue({ success: true } as never);

        jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
            success: true,
            data: { code: 'INVALID', subtotal: 100 },
        } as never);

        jest.mocked(validateAndCalculateDiscount).mockResolvedValue({
            data: null,
            error: null,
        } as never);

        const result = await validateAndApplyDiscountAction('INVALID', mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
        });
    });

    it('should catch thrown exception and return sanitized error', async () => {
        const thrownError = new Error('Database connection failed');
        jest.mocked(verifyRateLimit).mockRejectedValueOnce(thrownError);

        const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

        expect(result).toEqual({
            success: false,
            error: 'Sanitized error message',
        });
        expect(sanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
    });
});
