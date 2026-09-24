import { validateAndCalculateDiscount } from '@/data/checkout/services/CheckoutDiscountService';
import { fetchDiscountByCode } from '@/data/checkout/repositories/CheckoutDiscountRepository';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutDiscountRepository');

describe('CheckoutDiscountService', () => {
    const mockSupabase = {} as SupabaseClient<Database>;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(withRetry).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized database error',
        );
    });

    describe('validateAndCalculateDiscount', () => {
        it('should calculate percentage discount correctly', async () => {
            const mockDiscount = {
                id: 'disc-1',
                code: 'SUMMER20',
                type: 'percentage',
                value: 20,
                is_active: true,
                start_date: null,
                end_date: null,
                minimum_subtotal: null,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: mockDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount(' summer20 ', 100);

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                code: 'SUMMER20',
                discountPercent: 20,
                discountAmount: 20.0,
                minimumSubtotal: null,
            });
            expect(fetchDiscountByCode).toHaveBeenCalledWith(mockSupabase, 'SUMMER20');
        });

        it('should calculate fixed amount discount capped at subtotal correctly', async () => {
            const mockDiscount = {
                id: 'disc-2',
                code: 'FIXED15',
                type: 'fixed_amount',
                value: 15,
                is_active: true,
                start_date: null,
                end_date: null,
                minimum_subtotal: 10,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: mockDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('FIXED15', 50);

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                code: 'FIXED15',
                discountPercent: 0,
                discountAmount: 15.0,
                minimumSubtotal: 10,
            });
        });

        it('should return INVALID_DISCOUNT_CODE when query returns no record (data: null, error: null)', async () => {
            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('UNKNOWN', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.INVALID_DISCOUNT_CODE);
        });

        it('should return sanitized error when discount query returns a database error', async () => {
            const dbError = { message: 'Database connection failed' };
            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: null,
                error: dbError,
            } as never);

            const result = await validateAndCalculateDiscount('ERRCODE', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized database error');
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
        });

        it('should return DISCOUNT_NOT_ACTIVE when discount is_active is false', async () => {
            const inactiveDiscount = {
                id: 'disc-3',
                code: 'INACTIVE',
                type: 'percentage',
                value: 10,
                is_active: false,
                start_date: null,
                end_date: null,
                minimum_subtotal: null,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: inactiveDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('INACTIVE', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.DISCOUNT_NOT_ACTIVE);
        });

        it('should return DISCOUNT_NOT_ACTIVE when discount start_date is in the future', async () => {
            const futureDiscount = {
                id: 'disc-4',
                code: 'FUTURE',
                type: 'percentage',
                value: 10,
                is_active: true,
                start_date: new Date(Date.now() + 86400000).toISOString(),
                end_date: null,
                minimum_subtotal: null,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: futureDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('FUTURE', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.DISCOUNT_NOT_ACTIVE);
        });

        it('should return EXPIRED_DISCOUNT_CODE when discount end_date is in the past', async () => {
            const expiredDiscount = {
                id: 'disc-5',
                code: 'EXPIRED',
                type: 'percentage',
                value: 10,
                is_active: true,
                start_date: null,
                end_date: new Date(Date.now() - 86400000).toISOString(),
                minimum_subtotal: null,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: expiredDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('EXPIRED', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.EXPIRED_DISCOUNT_CODE);
        });

        it('should return minimum subtotal error message when subtotal requirement is not met', async () => {
            const thresholdDiscount = {
                id: 'disc-6',
                code: 'MIN50',
                type: 'fixed_amount',
                value: 10,
                is_active: true,
                start_date: null,
                end_date: null,
                minimum_subtotal: 50,
            };

            jest.mocked(fetchDiscountByCode).mockResolvedValue({
                data: thresholdDiscount,
                error: null,
            } as never);

            const result = await validateAndCalculateDiscount('MIN50', 30);

            expect(result.data).toBeNull();
            expect(result.error).toBe('This discount code requires a minimum subtotal of $50.00.');
        });

        it('should handle thrown exceptions and return sanitized error', async () => {
            jest.mocked(createBackendClient).mockRejectedValueOnce(new Error('Unexpected crash'));

            const result = await validateAndCalculateDiscount('TEST', 100);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized database error');
        });
    });
});
