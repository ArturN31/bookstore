import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import {
    fetchUserProfileById,
    fetchUserAuthData,
} from '@/data/checkout/repositories/CheckoutUserRepository';

describe('CheckoutUserRepository', () => {
    describe('fetchUserProfileById', () => {
        it('should query user profile by user ID', async () => {
            const mockProfile = {
                id: 'user-123',
                first_name: 'John',
                last_name: 'Doe',
            };

            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
            });

            const mockEq = jest.fn().mockReturnValue({
                maybeSingle: mockMaybeSingle,
            });

            const mockSelect = jest.fn().mockReturnValue({
                eq: mockEq,
            });

            const mockFrom = jest.fn().mockReturnValue({
                select: mockSelect,
            });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: mockProfile, error: null });
        });
    });

    describe('fetchUserAuthData', () => {
        it('should call supabase.auth.getUser()', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            const mockGetUser = jest.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const mockSupabase = {
                auth: {
                    getUser: mockGetUser,
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(mockGetUser).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: { user: mockUser }, error: null });
        });
    });
});
