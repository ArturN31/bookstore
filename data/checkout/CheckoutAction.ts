'use server';

import { checkRateLimit } from '@/utils/network/rateLimiter';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { getCurrentUserCheckoutData } from './services/CheckoutUserService';
import { validateAndCalculateDiscount } from './services/CheckoutDiscountService';
import { executeCheckoutOrder } from './services/CheckoutService';
import { AppliedDiscountState, ProcessCheckoutResult } from './CheckoutTypes';
import { applyDiscountSchema, checkoutFormSchema } from '@/data/schemas/checkoutSchema';

export interface ActionResult<T> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: string;
}

export const validateAndApplyDiscountAction = async (
    code: string,
    currentSubtotal: number,
): Promise<ActionResult<AppliedDiscountState>> => {
    try {
        const userResult = await getCurrentUserCheckoutData();
        const limitKey = userResult.data?.id ?? 'anonymous-discount';

        const rateLimit = checkRateLimit(`discount:${limitKey}`, 5, 60000);
        if (!rateLimit.success)
            return {
                success: false,
                error: 'Too many discount code attempts. Please wait a minute before trying again.',
            };

        const parseResult = applyDiscountSchema.safeParse({ code, subtotal: currentSubtotal });
        if (!parseResult.success)
            return {
                success: false,
                error:
                    parseResult.error.issues[0]?.message ??
                    APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
            };

        const discountResult = await validateAndCalculateDiscount(
            parseResult.data.code,
            currentSubtotal,
        );
        if (discountResult.error || !discountResult.data)
            return {
                success: false,
                error: discountResult.error ?? APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
            };

        return {
            success: true,
            data: discountResult.data,
        };
    } catch (err: unknown) {
        return {
            success: false,
            error: sanitizeSupabaseError(err),
        };
    }
};

export interface ProcessCheckoutActionPayload {
    readonly shippingDetails: unknown;
    readonly items: readonly { readonly bookId: string; readonly quantity: number }[];
    readonly discountId: string | null;
    readonly idempotencyKey: string;
    // TODO: Add stripePaymentMethodId?: string or stripePaymentIntentId?: string to payload if handling card confirmation server-side.
}

export const processCheckoutAction = async (
    payload: ProcessCheckoutActionPayload,
): Promise<ActionResult<ProcessCheckoutResult>> => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return {
                success: false,
                error: 'Stripe configuration is missing on the server.',
            };
        }

        const userResult = await getCurrentUserCheckoutData();

        if (userResult.error || !userResult.data?.id)
            return {
                success: false,
                error: APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
            };

        const userId = userResult.data.id;

        const rateLimit = checkRateLimit(`checkout:${userId}`, 3, 300000);
        if (!rateLimit.success)
            return {
                success: false,
                error: 'Too many checkout attempts. Please wait a few minutes before trying again.',
            };

        const formParse = checkoutFormSchema.safeParse(payload.shippingDetails);
        if (!formParse.success)
            return {
                success: false,
                error: formParse.error.issues[0]?.message ?? 'Invalid checkout form entries.',
            };

        const checkoutResult = await executeCheckoutOrder({
            userId,
            items: payload.items,
            discountId: payload.discountId,
            paymentMethod: formParse.data.paymentMethod,
            idempotencyKey: payload.idempotencyKey,
        });
        if (checkoutResult.error || !checkoutResult.data)
            return {
                success: false,
                error: checkoutResult.error ?? APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
            };

        // TODO: Handle mapping of Stripe-specific exception errors (e.g., StripeCardError) to user-friendly UI messages.
        return {
            success: true,
            data: checkoutResult.data,
        };
    } catch (err: unknown) {
        return {
            success: false,
            error: sanitizeSupabaseError(err),
        };
    }
};
