import {
    validateAndApplyDiscountAction,
    processCheckoutAction,
    ProcessCheckoutActionPayload,
} from '@/data/checkout/CheckoutAction';
import { checkRateLimit } from '@/utils/network/rateLimiter';
import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import { validateAndCalculateDiscount } from '@/data/checkout/services/CheckoutDiscountService';
import { executeCheckoutOrder } from '@/data/checkout/services/CheckoutService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { checkoutFormSchema, applyDiscountSchema } from '@/data/schemas/checkoutSchema';

jest.mock('@/utils/network/rateLimiter');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/services/CheckoutUserService');
jest.mock('@/data/checkout/services/CheckoutDiscountService');
jest.mock('@/data/checkout/services/CheckoutService');
jest.mock('@/data/schemas/checkoutSchema', () => ({
    checkoutFormSchema: {
        safeParse: jest.fn(),
    },
    applyDiscountSchema: {
        safeParse: jest.fn(),
    },
}));

describe('CheckoutAction', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, STRIPE_SECRET_KEY: 'sk_test_123' };

        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized error message',
        );
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('validateAndApplyDiscountAction', () => {
        const mockCode = 'SAVE10';
        const mockSubtotal = 100;

        it('should successfully validate and apply a valid discount code', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

            jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
                success: true,
                data: { code: 'SAVE10', subtotal: 100 },
            } as never);

            const mockAppliedDiscount = {
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
            expect(checkRateLimit).toHaveBeenCalledWith('discount:user-123', 5, 60000);
            expect(validateAndCalculateDiscount).toHaveBeenCalledWith('SAVE10', 100);
        });

        it('should fallback to anonymous limitKey when user data is null', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

            jest.mocked(applyDiscountSchema.safeParse).mockReturnValue({
                success: true,
                data: { code: 'SAVE10', subtotal: 100 },
            } as never);

            jest.mocked(validateAndCalculateDiscount).mockResolvedValue({
                data: {
                    code: 'SAVE10',
                    discountPercent: 10,
                    discountAmount: 10,
                    minimumSubtotal: null,
                },
                error: null,
            } as never);

            await validateAndApplyDiscountAction(mockCode, mockSubtotal);

            expect(checkRateLimit).toHaveBeenCalledWith('discount:anonymous-discount', 5, 60000);
        });

        it('should return rate limit error when user exceeds rate limit', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: false } as never);

            const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

            expect(result).toEqual({
                success: false,
                error: 'Too many discount code attempts. Please wait a minute before trying again.',
            });
        });

        it('should return schema validation error when code or subtotal is invalid', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
                data: { id: 'user-123', email: 'user@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
            jest.mocked(getCurrentUserCheckoutData).mockRejectedValueOnce(thrownError);

            const result = await validateAndApplyDiscountAction(mockCode, mockSubtotal);

            expect(result).toEqual({
                success: false,
                error: 'Sanitized error message',
            });
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(thrownError);
        });
    });

    describe('processCheckoutAction', () => {
        const mockPayload: ProcessCheckoutActionPayload = {
            shippingDetails: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                paymentMethod: 'card',
            },
            items: [{ bookId: 'book-1', quantity: 2 }],
            discountId: 'disc-10',
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

        it('should successfully execute checkout order when payload is valid', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

            jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
                success: true,
                data: { paymentMethod: 'card' },
            } as never);

            const mockProcessResult = {
                success: true,
                orderId: 'order-777',
                clientSecret: 'pi_secret_123',
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
            expect(checkRateLimit).toHaveBeenCalledWith('checkout:user-123', 3, 300000);
            expect(executeCheckoutOrder).toHaveBeenCalledWith({
                userId: 'user-123',
                items: mockPayload.items,
                discountId: 'disc-10',
                paymentMethod: 'card',
                idempotencyKey: 'idemp-xyz-123',
            });
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
                data: { id: '' },
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
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: false } as never);

            const result = await processCheckoutAction(mockPayload);

            expect(result).toEqual({
                success: false,
                error: 'Too many checkout attempts. Please wait a few minutes before trying again.',
            });
        });

        it('should return schema error when checkout form details are invalid', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

            jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
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
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

            jest.mocked(checkoutFormSchema.safeParse).mockReturnValue({
                success: false,
                error: { issues: [] },
            } as never);

            const result = await processCheckoutAction(mockPayload);

            expect(result).toEqual({
                success: false,
                error: 'Invalid checkout form entries.',
            });
        });

        it('should return error when executeCheckoutOrder fails with an error string', async () => {
            jest.mocked(getCurrentUserCheckoutData).mockResolvedValue({
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
                data: { id: 'user-123', email: 'jane@example.com' },
                error: null,
            } as never);

            jest.mocked(checkRateLimit).mockReturnValue({ success: true } as never);

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
});
