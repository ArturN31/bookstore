import {
    fetchUserProfileById,
    fetchWishlistByUserId,
    fetchUserAuthData,
} from '@/data/user/UserRepository';
import { createBackendClient } from '@/utils/db/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { UserConstants } from '@/data/user/UserConstants';

jest.mock('@/utils/db/server');

describe('UserRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    const mockSupabaseClient = (response: { data: any; error: any }) =>
        ({
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue(response),
        }) as unknown as SupabaseClient<Database>;

    describe('fetchUserProfileById', () => {
        it('should return user data when query succeeds', async () => {
            const mockSupabase = mockSupabaseClient({
                data: { id: 'user-123', username: 'testuser' },
                error: null,
            });
            (createBackendClient as jest.Mock).mockReturnValue(mockSupabase);

            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toEqual({ id: 'user-123', username: 'testuser' });
            expect(result.error).toBeNull();
        });

        it('should return error when database query fails', async () => {
            const mockSupabase = mockSupabaseClient({ data: null, error: { message: 'DB error' } });
            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_PROFILE_FETCH_FAILED);
        });

        it('should return null data when user not found (no error)', async () => {
            const mockSupabase = mockSupabaseClient({ data: null, error: null });
            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe(null);
        });

        it('should handle Supabase error object', async () => {
            const mockSupabase = mockSupabaseClient({
                data: null,
                error: new Error('Supabase error'),
            });
            const result = await fetchUserProfileById(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_PROFILE_FETCH_FAILED);
        });

        it('should return error when supabase client is missing', async () => {
            // @ts-expect-error - testing runtime null check
            const result = await fetchUserProfileById(null, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_SUPABASE_FAILED);
        });

        it('should handle generic catch block with Error object (Line 38 true branch)', async () => {
            const mockSupabase = {
                from: jest.fn().mockImplementation(() => {
                    throw new Error('Standard Error');
                }),
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Standard Error');
        });

        it('should handle generic catch block with a string (Line 38 false branch)', async () => {
            const mockSupabase = {
                from: jest.fn().mockImplementation(() => {
                    throw 'String Error';
                }),
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserProfileById(mockSupabase, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
        });
    });

    describe('fetchWishlistByUserId', () => {
        const mockSupabaseWishlist = (response: { data: any; error: any }) =>
            ({
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue(response),
            }) as unknown as SupabaseClient<Database>;

        it('should return wishlist items when query succeeds', async () => {
            const mockSupabase = mockSupabaseWishlist({
                data: [{ id: '1', book_id: 'book-1' }],
                error: null,
            });
            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toEqual([{ id: '1', book_id: 'book-1' }]);
            expect(result.error).toBeNull();
        });

        it('should return error when database query fails', async () => {
            const mockSupabase = mockSupabaseWishlist({
                data: null,
                error: { message: 'DB error' },
            });
            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_FETCH_FAILED);
        });

        it('should return empty array when wishlist not found (no error)', async () => {
            const mockSupabase = mockSupabaseWishlist({ data: [], error: null });
            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toEqual([]);
            expect(result.error).toBe(null);
        });

        it('should return error when supabase client is missing', async () => {
            // @ts-expect-error
            const result = await fetchWishlistByUserId(null, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_SUPABASE_FAILED);
        });

        it('should handle generic catch block with Error object (Line 65 true branch)', async () => {
            const mockSupabase = {
                from: jest.fn().mockImplementation(() => {
                    throw new Error('Wishlist Error');
                }),
            } as unknown as SupabaseClient<Database>;

            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Wishlist Error');
        });

        it('should handle generic catch block with a plain object (Line 65 false branch)', async () => {
            const mockSupabase = {
                from: jest.fn().mockImplementation(() => {
                    throw { message: 'Object error' };
                }),
            } as unknown as SupabaseClient<Database>;

            const result = await fetchWishlistByUserId(mockSupabase, 'user-123');
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
        });
    });

    describe('fetchUserAuthData', () => {
        it('should return auth data when user is authenticated', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { email: 'test@example.com', id: 'user-123' } },
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(result.data).toEqual({ email: 'test@example.com', userID: 'user-123' });
            expect(result.error).toBeNull();
        });

        it('should return error when auth user is not found', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(result.data).toEqual({ email: null, userID: null });
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return error when email is missing', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);

            expect(result.data).toEqual({ email: null, userID: null });
            expect(result.error).toBe(UserConstants.ERROR_EMAIL_NOT_FOUND);
        });

        it('should handle generic catch block with Error object (Line 93 true branch)', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockRejectedValue(new Error('Auth Exception')),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);
            expect(result.error).toBe(UserConstants.ERROR_SYSTEM_ERROR);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Auth Exception');
        });

        it('should handle generic catch block with null (Line 93 false branch)', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockImplementation(() => {
                        throw null;
                    }),
                },
            } as unknown as SupabaseClient<Database>;

            const result = await fetchUserAuthData(mockSupabase);
            expect(result.error).toBe(UserConstants.ERROR_SYSTEM_ERROR);
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
        });
    });
});
