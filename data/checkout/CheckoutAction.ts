'use server';

import { verifyRateLimit, limiters } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { getCurrentUserCheckoutData } from './services/CheckoutUserService';
import { validateAndCalculateDiscount } from './services/CheckoutDiscountService';
import { executeCheckoutOrder } from './services/CheckoutService';
import { getActiveCartCheckoutItems } from './services/CheckoutCartService';
import { AppliedDiscountState, ProcessCheckoutResult } from './CheckoutTypes';
import { applyDiscountSchema, serverCheckoutPayloadSchema } from '@/data/schemas/checkoutSchema';

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
        const parseResult = applyDiscountSchema.safeParse({ code, subtotal: currentSubtotal });
        if (!parseResult.success)
            return {
                success: false,
                error:
                    parseResult.error.issues[0]?.message ??
                    APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
            };

        const clientIp = await getAppClientIp();
        const rateLimit = await verifyRateLimit({
            identifier: `ip:${clientIp}`,
            limiter: limiters.discount,
            failClosed: true,
        });
        if (!rateLimit.success)
            return {
                success: false,
                error: rateLimit.error ?? 'Too many discount verification attempts.',
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
    readonly discountId: string | null;
    readonly shippingMethodId: string;
    readonly idempotencyKey: string;
}

export const processCheckoutAction = async (
    payload: ProcessCheckoutActionPayload,
): Promise<ActionResult<ProcessCheckoutResult>> => {
    try {
        if (!process.env.STRIPE_SECRET_KEY)
            return {
                success: false,
                error: 'Stripe configuration is missing on the server.',
            };

        const payloadParse = serverCheckoutPayloadSchema.safeParse(payload);
        if (!payloadParse.success)
            return {
                success: false,
                error: payloadParse.error.issues[0]?.message ?? 'Invalid checkout payload entries.',
            };

        const validatedPayload = payloadParse.data;

        const clientIp = await getAppClientIp();
        const ipRateLimit = await verifyRateLimit({
            identifier: `ip:${clientIp}`,
            limiter: limiters.checkout,
            failClosed: true,
        });
        if (!ipRateLimit.success)
            return {
                success: false,
                error: ipRateLimit.error ?? 'Too many checkout attempts. Please wait a moment.',
            };

        const userResult = await getCurrentUserCheckoutData();

        if (userResult.error || !userResult.data?.id)
            return {
                success: false,
                error: APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED,
            };

        const userId = userResult.data.id;
        const customerEmail = userResult.data.email;
        const stripeCustomerId = userResult.data.stripeCustomerId;

        const userRateLimit = await verifyRateLimit({
            identifier: `user:${userId}`,
            limiter: limiters.checkout,
            failClosed: true,
        });

        if (!userRateLimit.success)
            return {
                success: false,
                error: userRateLimit.error ?? 'Too many checkout attempts. Please wait a moment.',
            };

        const serverCartResult = await getActiveCartCheckoutItems(userId);
        if (serverCartResult.error || !serverCartResult.data || serverCartResult.data.length === 0)
            return {
                success: false,
                error: serverCartResult.error ?? APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT,
            };

        const authoritativeItems = serverCartResult.data.map((item) => ({
            bookId: item.id,
            quantity: item.quantity,
        }));

        const checkoutResult = await executeCheckoutOrder({
            userId,
            customerEmail,
            stripeCustomerId,
            items: authoritativeItems,
            discountId: validatedPayload.discountId,
            paymentMethod: validatedPayload.shippingDetails.paymentMethod,
            shippingMethodId: validatedPayload.shippingMethodId,
            idempotencyKey: validatedPayload.idempotencyKey,
            shippingAddress: {
                firstName: validatedPayload.shippingDetails.firstName,
                lastName: validatedPayload.shippingDetails.lastName,
                streetAddress: validatedPayload.shippingDetails.streetAddress,
                city: validatedPayload.shippingDetails.city,
                postcode: validatedPayload.shippingDetails.postcode,
                country: validatedPayload.shippingDetails.country,
                phoneNumber: validatedPayload.shippingDetails.phoneNumber,
            },
        });

        if (checkoutResult.error || !checkoutResult.data)
            return {
                success: false,
                error: checkoutResult.error ?? APP_ERROR_MESSAGES.ORDER_CREATION_FAILED,
            };

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
