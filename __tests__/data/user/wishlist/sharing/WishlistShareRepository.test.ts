import {
    fetchWishlistByToken,
    fetchWishlistByUsername,
    updateWishlistVisibilityAndToken,
} from '@/data/user/wishlist/sharing/WishlistShareRepository';
import { createAdminClient } from '@/utils/db/admin';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { withRetry } from '@/utils/network/retry';

jest.mock('@/data/user/UserConstants', () => ({
    WISHLIST_TABLE: 'test_wishlist_table',
}));

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => {
        if (err instanceof Error) return err.message;
        return String(err);
    }),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(async <T>(cb: () => Promise<T>) => {
        return await cb();
    }),
}));

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (cb: () => Promise<{ data: unknown; error: unknown }>) => {
        try {
            const res = await cb();
            return { data: res.data || null, error: res.error || null };
        } catch (err: unknown) {
            return { data: null, error: err };
        }
    }),
}));

describe('WishlistShareRepository', () => {
    const mockMaybeSingle = jest.fn();
    const mockEq = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnThis();
    const mockUpdate = jest.fn().mockReturnThis();

    const mockQueryBuilder = {
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        update: mockUpdate,
    };

    const mockSupabaseClient = {
        from: jest.fn(() => mockQueryBuilder),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (createAdminClient as jest.MockedFunction<typeof createAdminClient>).mockResolvedValue(
            mockSupabaseClient as unknown as Awaited<ReturnType<typeof createAdminClient>>,
        );

        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            mockSupabaseClient as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );

        mockEq.mockImplementation(() => mockQueryBuilder);
        mockSelect.mockImplementation(() => mockQueryBuilder);
        mockUpdate.mockImplementation(() => mockQueryBuilder);
    });

    describe('fetchWishlistByUsername', () => {
        const validUserData = {
            id: 'user-123',
            username: 'testuser',
            first_name: 'John',
            last_name: 'Doe',
            test_wishlist_table: [{ id: 'item-1', book_id: 'book-1', books: null }],
        };

        it('should successfully fetch a public wishlist by username', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: validUserData, error: null });

            const result = await fetchWishlistByUsername('testuser');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
            expect(mockEq).toHaveBeenCalledWith('username', 'testuser');
            expect(mockEq).toHaveBeenCalledWith('is_wishlist_public', true);
            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                user_id: 'user-123',
                username: 'testuser',
                first_name: 'John',
                last_name: 'Doe',
                wishlist: validUserData.test_wishlist_table,
            });
        });

        it('should fallback to an empty array if wishlist is not an array', async () => {
            const dataWithoutArray = { ...validUserData, test_wishlist_table: null };
            mockMaybeSingle.mockResolvedValueOnce({ data: dataWithoutArray, error: null });

            const result = await fetchWishlistByUsername('testuser');

            expect(result.data?.wishlist).toEqual([]);
        });

        it('should return null data if no profile is found', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const result = await fetchWishlistByUsername('unknownuser');

            expect(result).toEqual({ data: null, error: null });
        });

        it('should return error if the database query fails', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

            const result = await fetchWishlistByUsername('testuser');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('DB Error'));
            expect(result).toEqual({ data: null, error: 'DB Error' });
        });

        it('should catch and return errors thrown from within withRetry block', async () => {
            (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Retry crashed'));

            const result = await fetchWishlistByUsername('testuser');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Retry crashed'));
            expect(result).toEqual({ data: null, error: 'Retry crashed' });
        });
    });

    describe('fetchWishlistByToken', () => {
        const validTokenData = {
            id: 'user-456',
            username: 'tokenuser',
            first_name: 'Jane',
            last_name: 'Smith',
            test_wishlist_table: [{ id: 'item-2', book_id: 'book-2', books: null }],
        };

        it('should successfully fetch a wishlist by token', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: validTokenData, error: null });

            const result = await fetchWishlistByToken('valid-token');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
            expect(mockEq).toHaveBeenCalledWith('wishlist_share_token', 'valid-token');
            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                user_id: 'user-456',
                username: 'tokenuser',
                first_name: 'Jane',
                last_name: 'Smith',
                wishlist: validTokenData.test_wishlist_table,
            });
        });

        it('should fallback to an empty array if wishlist is not an array', async () => {
            const dataWithoutArray = { ...validTokenData, test_wishlist_table: 'invalid' };
            mockMaybeSingle.mockResolvedValueOnce({ data: dataWithoutArray, error: null });

            const result = await fetchWishlistByToken('valid-token');

            expect(result.data?.wishlist).toEqual([]);
        });

        it('should return null data if no profile is found for token', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const result = await fetchWishlistByToken('invalid-token');

            expect(result).toEqual({ data: null, error: null });
        });

        it('should return error if the database query fails', async () => {
            mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

            const result = await fetchWishlistByToken('valid-token');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('DB Error'));
            expect(result).toEqual({ data: null, error: 'DB Error' });
        });

        it('should catch and return errors thrown from within withRetry block', async () => {
            (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Retry crashed'));

            const result = await fetchWishlistByToken('valid-token');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Retry crashed'));
            expect(result).toEqual({ data: null, error: 'Retry crashed' });
        });
    });

    describe('updateWishlistVisibilityAndToken', () => {
        it('should update is_wishlist_public to true and set token to null', async () => {
            mockEq.mockResolvedValueOnce({ error: null });

            const result = await updateWishlistVisibilityAndToken('user-123', true, 'some-token');

            expect(mockUpdate).toHaveBeenCalledWith({
                is_wishlist_public: true,
                wishlist_share_token: null,
            });
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(result).toEqual({ error: null });
        });

        it('should update is_wishlist_public to false and set a new token', async () => {
            mockEq.mockResolvedValueOnce({ error: null });

            const result = await updateWishlistVisibilityAndToken('user-123', false, 'new-token');

            expect(mockUpdate).toHaveBeenCalledWith({
                is_wishlist_public: false,
                wishlist_share_token: 'new-token',
            });
            expect(result).toEqual({ error: null });
        });

        it('should update is_wishlist_public to false without altering token if newToken is undefined', async () => {
            mockEq.mockResolvedValueOnce({ error: null });

            const result = await updateWishlistVisibilityAndToken('user-123', false);

            expect(mockUpdate).toHaveBeenCalledWith({
                is_wishlist_public: false,
            });
            expect(result).toEqual({ error: null });
        });

        it('should update is_wishlist_public to false and set token to null if newToken is explicitly null', async () => {
            mockEq.mockResolvedValueOnce({ error: null });

            const result = await updateWishlistVisibilityAndToken('user-123', false, null);

            expect(mockUpdate).toHaveBeenCalledWith({
                is_wishlist_public: false,
                wishlist_share_token: null,
            });
            expect(result).toEqual({ error: null });
        });

        it('should return error if Supabase update fails', async () => {
            mockEq.mockResolvedValueOnce({ error: new Error('Update failed') });

            const result = await updateWishlistVisibilityAndToken('user-123', true);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Update failed'));
            expect(result).toEqual({ error: 'Update failed' });
        });

        it('should catch and return errors thrown during the execution', async () => {
            mockUpdate.mockImplementationOnce(() => {
                throw new Error('Unexpected throw');
            });

            const result = await updateWishlistVisibilityAndToken('user-123', true);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Unexpected throw'));
            expect(result).toEqual({ error: 'Unexpected throw' });
        });
    });
});
