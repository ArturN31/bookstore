import { getUserData, getUserWishlist } from '@/data/user/GetUserData';
import { createBackendClient } from '@/utils/db/server';
import {
    fetchUserProfileById,
    fetchWishlistByUserId,
    fetchUserAuthData,
} from '@/data/user/UserRepository';
import { UserConstants } from '@/data/user/UserConstants';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserRepository');

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

describe('GetUserData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('getUserData', () => {
        it('should return user data on success', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'user-123', email: 'test@test.com' },
                error: null,
            });
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: { id: 'user-123', username: 'testuser' },
                error: null,
            });

            const result = await getUserData();
            expect(result.data?.email).toBe('test@test.com');
        });

        it('should exercise the || null branch on line 54', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'user-123', email: 'test@test.com' },
                error: null,
            });
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: { id: 'user-123' },
                error: null,
            });

            const result = await getUserData();
            expect(result.data).toBeDefined();
        });

        it('should return auth error when data is null (Line 26)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({ data: null, error: 'fail' });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is missing (Line 32)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: '', email: 'test@test.com' },
                error: null,
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when email is missing (Line 32)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'user-123', email: null },
                error: null,
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return DB error when profile fetch fails (Line 42)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'user-123', email: 'test@test.com' },
                error: null,
            });
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: null,
                error: 'DB error',
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
        });

        it('should return not found error when profile is null (Line 48)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'user-123', email: 'test@test.com' },
                error: null,
            });
            (fetchUserProfileById as jest.Mock).mockResolvedValue({ data: null, error: null });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_PROFILE_NOT_FOUND);
        });

        it('should log error message from Error object in catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(new Error('Hard Fail'));
            await getUserData();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Hard Fail');
        });

        it('should log Unknown error when catch receives a string', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue('String Fail');
            await getUserData();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
        });
    });

    describe('getUserWishlist', () => {
        it('should return missing ID error', async () => {
            const result = await getUserWishlist('');
            expect(result.error).toBe(UserConstants.ERROR_MISSING_USER_ID);
        });

        it('should return fetch failed error when error exists (Line 93)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: null, error: 'fail' });
            const result = await getUserWishlist('user-123');
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_FETCH_FAILED);
        });

        it('should return fetch failed error when data is null (Line 93)', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: null, error: null });
            const result = await getUserWishlist('user-123');
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_FETCH_FAILED);
        });

        it('should handle Error object in wishlist catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(new Error('Wishlist Fail'));
            await getUserWishlist('user-123');
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Wishlist Fail');
        });

        it('should handle non-Error in wishlist catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(null);
            await getUserWishlist('user-123');
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
        });

        it('should return data on success', async () => {
            (createBackendClient as jest.Mock).mockResolvedValue({});
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: [], error: null });
            const result = await getUserWishlist('user-123');
            expect(result.data).toEqual([]);
        });
    });
});
