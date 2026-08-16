import {
    fetchUserProfileById,
    fetchWishlistByUserId,
    fetchUserAuthData,
    updateUsername,
} from '@/data/user/UserRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

jest.mock('next/headers', () => ({
    headers: jest.fn(() => ({
        get: jest.fn(() => null),
    })),
}));

describe('UserRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchUserProfileById', () => {
        it('should return user profile data when query succeeds', async () => {
            const mockData = { id: 'user-123', username: 'testuser' };
            const mockResponse = { data: mockData, error: null };

            const mockMaybeSingle = jest.fn().mockResolvedValue(mockResponse);
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(mockMaybeSingle).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        it('should return error when database query fails', async () => {
            const mockError = { message: 'DB error', code: 'PGRST100' };
            const mockResponse = { data: null, error: mockError };

            const mockMaybeSingle = jest.fn().mockResolvedValue(mockResponse);
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });

        it('should return null data when user is not found (no error)', async () => {
            const mockResponse = { data: null, error: null };

            const mockMaybeSingle = jest.fn().mockResolvedValue(mockResponse);
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });
    });

    describe('fetchWishlistByUserId', () => {
        it('should return wishlist items when query succeeds', async () => {
            const mockData = [{ id: '1', book_id: 'book-1' }];
            const mockResponse = { data: mockData, error: null };

            const mockEq = jest.fn().mockResolvedValue(mockResponse);
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(mockFrom).toHaveBeenCalledWith('wishlist');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(result).toEqual(mockResponse);
        });

        it('should return error when database query fails', async () => {
            const mockError = { message: 'DB error', code: 'PGRST100' };
            const mockResponse = { data: null, error: mockError };

            const mockEq = jest.fn().mockResolvedValue(mockResponse);
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });

        it('should return empty array when wishlist is empty (no error)', async () => {
            const mockResponse = { data: [], error: null };

            const mockEq = jest.fn().mockResolvedValue(mockResponse);
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toEqual([]);
            expect(result.error).toBeNull();
        });
    });

    describe('fetchUserAuthData', () => {
        it('should return auth data when user is authenticated', async () => {
            const mockAuthResponse = {
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            };

            const mockGetUser = jest.fn().mockResolvedValue(mockAuthResponse);
            const mockSupabase = {
                auth: {
                    getUser: mockGetUser,
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(mockGetUser).toHaveBeenCalled();
            expect(result).toEqual(mockAuthResponse);
        });

        it('should return auth error when authentication fails', async () => {
            const mockAuthError = {
                message: 'Auth session missing',
                name: 'AuthApiError',
                status: 400,
            };
            const mockAuthResponse = {
                data: { user: null },
                error: mockAuthError,
            };

            const mockGetUser = jest.fn().mockResolvedValue(mockAuthResponse);
            const mockSupabase = {
                auth: {
                    getUser: mockGetUser,
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(result.data.user).toBeNull();
            expect(result.error).toEqual(mockAuthError);
        });
    });

    describe('updateUsername', () => {
        it('should update username successfully', async () => {
            const mockUpdatedData = [{ id: 'user-123', username: 'newusername' }];
            const mockResponse = { data: mockUpdatedData, error: null };

            const mockSelect = jest.fn().mockResolvedValue(mockResponse);
            const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
            const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await updateUsername(mockSupabase, 'user-123', 'newusername');

            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockUpdate).toHaveBeenCalledWith({ username: 'newusername' });
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(mockSelect).toHaveBeenCalled();
            expect(result).toEqual(mockResponse);
        });

        it('should return error when update fails', async () => {
            const mockError = { message: 'Update error', code: 'PGRST100' };
            const mockResponse = { data: null, error: mockError };

            const mockSelect = jest.fn().mockResolvedValue(mockResponse);
            const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
            const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
            const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

            const mockSupabase = {
                from: mockFrom,
            } as unknown as SupabaseClient<Database>;

            const result = await updateUsername(mockSupabase, 'user-123', 'newusername');

            expect(result.data).toBeNull();
            expect(result.error).toEqual(mockError);
        });
    });
});
