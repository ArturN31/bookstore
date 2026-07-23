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

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('GetUserData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        (createBackendClient as jest.Mock).mockResolvedValue({});
        (fetchUserAuthData as jest.Mock).mockResolvedValue({
            data: { userID: VALID_UUID, email: 'test@test.com' },
            error: null,
        });
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('getUserData', () => {
        it('should return user data on success', async () => {
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: { id: VALID_UUID, username: 'testuser' },
                error: null,
            });

            const result = await getUserData();
            expect(result.data?.email).toBe('test@test.com');
        });

        it('should exercise the || null branch on line 54', async () => {
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: { id: VALID_UUID },
                error: null,
            });

            const result = await getUserData();
            expect(result.data).toBeDefined();
        });

        it('should return auth error when data is null (Line 26)', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({ data: null, error: 'fail' });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is missing (Line 32)', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: '', email: 'test@test.com' },
                error: null,
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when email is missing (Line 32)', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: VALID_UUID, email: null },
                error: null,
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is not a valid UUID', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'invalid-uuid', email: 'test@test.com' },
                error: null,
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return DB error when profile fetch fails (Line 42)', async () => {
            (fetchUserProfileById as jest.Mock).mockResolvedValue({
                data: null,
                error: 'DB error',
            });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_DATABASE_QUERY_FAILED);
        });

        it('should return not found error when profile is null (Line 48)', async () => {
            (fetchUserProfileById as jest.Mock).mockResolvedValue({ data: null, error: null });
            const result = await getUserData();
            expect(result.error).toBe(UserConstants.ERROR_PROFILE_NOT_FOUND);
        });

        it('should log error message from Error object in catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(new Error('Hard Fail'));
            const result = await getUserData();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Hard Fail');
            expect(result.error).toBe(UserConstants.ERROR_SYSTEM_ERROR);
        });

        it('should log Unknown error when catch receives a string', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue('String Fail');
            const result = await getUserData();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
            expect(result.error).toBe(UserConstants.ERROR_SYSTEM_ERROR);
        });
    });

    describe('getUserWishlist', () => {
        it('should return auth error when user auth fails', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({ data: null, error: 'fail' });
            const result = await getUserWishlist();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is not a valid UUID', async () => {
            (fetchUserAuthData as jest.Mock).mockResolvedValue({
                data: { userID: 'invalid-uuid' },
                error: null,
            });
            const result = await getUserWishlist();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return fetch failed error when error exists (Line 93)', async () => {
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: null, error: 'fail' });
            const result = await getUserWishlist();
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_FETCH_FAILED);
        });

        it('should return fetch failed error when data is null (Line 93)', async () => {
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: null, error: null });
            const result = await getUserWishlist();
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_FETCH_FAILED);
        });

        it('should handle Error object in wishlist catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(new Error('Wishlist Fail'));
            const result = await getUserWishlist();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Wishlist Fail');
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_SYSTEM_ERROR);
        });

        it('should handle non-Error in wishlist catch', async () => {
            (createBackendClient as jest.Mock).mockRejectedValue(null);
            const result = await getUserWishlist();
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Unknown error');
            expect(result.error).toBe(UserConstants.ERROR_WISHLIST_SYSTEM_ERROR);
        });

        it('should return data on success', async () => {
            (fetchWishlistByUserId as jest.Mock).mockResolvedValue({ data: [], error: null });
            const result = await getUserWishlist();
            expect(result.data).toEqual([]);
        });
    });
});
