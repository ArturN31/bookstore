import { createBackendClient } from '@/utils/db/server';
import { Database } from '@/database.types';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { fetchDiscountByCode } from '../repositories/CheckoutDiscountRepository';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AppliedDiscountState } from '../CheckoutTypes';

type DiscountRow = Database['public']['Tables']['discounts']['Row'];

export const validateAndCalculateDiscount = async (
    code: string,
    currentSubtotal: number,
): Promise<SafeQueryResult<AppliedDiscountState>> => {
    try {
        const supabase = await createBackendClient();
        const sanitizedCode = code.trim().toUpperCase();

        const discountQueryResult = await safeSupabaseQuery<DiscountRow>(() =>
            withRetry(() => fetchDiscountByCode(supabase, sanitizedCode)),
        );
        if (discountQueryResult.error || !discountQueryResult.data)
            return {
                data: null,
                error: discountQueryResult.error
                    ? sanitizeSupabaseError(discountQueryResult.error)
                    : APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE,
            };

        const discount = discountQueryResult.data;
        if (!discount.is_active)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.DISCOUNT_NOT_ACTIVE,
            };

        const now = new Date();
        if (discount.start_date && new Date(discount.start_date) > now)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.DISCOUNT_NOT_ACTIVE,
            };
        if (discount.end_date && new Date(discount.end_date) < now)
            return {
                data: null,
                error: APP_ERROR_MESSAGES.EXPIRED_DISCOUNT_CODE,
            };

        const minimumSubtotal =
            discount.minimum_subtotal !== null ? Number(discount.minimum_subtotal) : null;
        if (minimumSubtotal !== null && currentSubtotal < minimumSubtotal)
            return {
                data: null,
                error: `This discount code requires a minimum subtotal of $${minimumSubtotal.toFixed(2)}.`,
            };

        const rawValue = Number(discount.value);
        let calculatedDeduction = 0;
        let discountPercent = 0;

        if (discount.type === 'percentage') {
            discountPercent = rawValue;
            calculatedDeduction = (currentSubtotal * rawValue) / 100;
        } else if (discount.type === 'fixed_amount') {
            discountPercent = 0;
            calculatedDeduction = Math.min(rawValue, currentSubtotal);
        }

        // TODO: If sync with Stripe Coupons/Promotion Codes is required, validate that discount.code matches an active Stripe Coupon ID.
        return {
            data: {
                code: discount.code,
                discountPercent: discountPercent,
                discountAmount: Number(calculatedDeduction.toFixed(2)),
                minimumSubtotal: minimumSubtotal,
            },
            error: null,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
