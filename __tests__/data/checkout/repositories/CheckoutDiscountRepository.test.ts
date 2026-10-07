import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { fetchDiscountByCode } from '@/data/checkout/repositories/CheckoutDiscountRepository';

describe('CheckoutDiscountRepository', () => {
    describe('fetchDiscountByCode', () => {
        it('should query discounts table by code', async () => {
            const mockDiscount = {
                id: 'disc-123',
                code: 'SAVE10',
                value: 10,
                type: 'percentage',
                is_active: true,
            };

            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: mockDiscount,
                error: null,
            });

            const mockEqCode = jest.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEqCode,
            });

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchDiscountByCode(mockSupabase, 'SAVE10');

            expect(mockFrom).toHaveBeenCalledWith('discounts');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEqCode).toHaveBeenCalledWith('code', 'SAVE10');
            expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: mockDiscount, error: null });
        });
    });
});
