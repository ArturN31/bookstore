import { getUserData, getUserWishlist } from '@/data/user/UserService';
import { createBackendClient } from '@/utils/db/server';
import {
    fetchUserProfileById,
    fetchWishlistByUserId,
    fetchUserAuthData,
} from '@/data/user/UserRepository';
import { UserConstants, UserServiceLogPrefix } from '@/data/user/UserConstants';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserRepository');
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => {
        if (typeof err === 'string') return `Sanitized: ${err}`;
        if (
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof (err as { message: unknown }).message === 'string'
        ) {
            return `Sanitized: ${(err as { message: string }).message}`;
        }
        if (err instanceof Error) {
            return `Sanitized: ${err.message}`;
        }
        return 'Sanitized error';
    }),
}));

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            {} as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
            data: { user: { id: VALID_UUID, email: 'test@test.com' } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    describe('getUserData', () => {
        it('should return user data on success', async () => {
            (
                fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
            ).mockResolvedValue({
                data: { id: VALID_UUID, username: 'testuser' },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

            const result = await getUserData();

            expect(result.data).toEqual({
                id: VALID_UUID,
                username: 'testuser',
                email: 'test@test.com',
            });
            expect(result.error).toBeNull();
        });

        it('should exercise profile mapping with default fields', async () => {
            (
                fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
            ).mockResolvedValue({
                data: { id: VALID_UUID },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

            const result = await getUserData();

            expect(result.data).toEqual({
                id: VALID_UUID,
                email: 'test@test.com',
            });
            expect(result.error).toBeNull();
        });

        it('should return auth error when fetchUserAuthData returns error', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: null,
                error: 'fail',
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when user payload is missing from auth data', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is missing', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: { id: '', email: 'test@test.com' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when email is missing', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: { id: VALID_UUID, email: '' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is not a valid UUID', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: { id: 'invalid-uuid', email: 'test@test.com' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return sanitized error when profile fetch fails', async () => {
            (
                fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
            ).mockResolvedValue({
                data: null,
                error: 'DB error',
            } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized: DB error');
        });

        it('should return null error and null data when profile is null', async () => {
            (
                fetchUserProfileById as jest.MockedFunction<typeof fetchUserProfileById>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserProfileById>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });

        it('should log error message from Error object in catch', async () => {
            const hardFail = new Error('Hard Fail');
            (
                createBackendClient as jest.MockedFunction<typeof createBackendClient>
            ).mockRejectedValue(hardFail);

            const result = await getUserData();

            expect(console.error).toHaveBeenCalledWith(
                `${UserServiceLogPrefix} Unexpected Error:`,
                hardFail,
            );
            expect(result.error).toBe('Sanitized: Hard Fail');
        });

        it('should log raw error when catch receives non-Error object', async () => {
            (
                createBackendClient as jest.MockedFunction<typeof createBackendClient>
            ).mockRejectedValue('String Fail');

            const result = await getUserData();

            expect(console.error).toHaveBeenCalledWith(
                `${UserServiceLogPrefix} Unexpected Error:`,
                'String Fail',
            );
            expect(result.error).toBe('Sanitized: String Fail');
        });

        it('BRANCH COVERAGE: should return auth error if email is null in auth payload', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: { id: VALID_UUID, email: null as unknown as string } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });
    });

    describe('getUserWishlist', () => {
        it('should return auth error when user auth fails', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: null,
                error: 'fail',
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserWishlist();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return auth error when userID is not a valid UUID', async () => {
            (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
                data: { user: { id: 'invalid-uuid', email: 'test@test.com' } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);

            const result = await getUserWishlist();

            expect(result.data).toBeNull();
            expect(result.error).toBe(UserConstants.ERROR_AUTH_FAILED);
        });

        it('should return sanitized error when wishlist fetch returns error', async () => {
            (
                fetchWishlistByUserId as jest.MockedFunction<typeof fetchWishlistByUserId>
            ).mockResolvedValue({
                data: null,
                error: 'fail',
            } as unknown as Awaited<ReturnType<typeof fetchWishlistByUserId>>);

            const result = await getUserWishlist();

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized: fail');
        });

        it('should return empty array when wishlist data is null without error', async () => {
            (
                fetchWishlistByUserId as jest.MockedFunction<typeof fetchWishlistByUserId>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchWishlistByUserId>>);

            const result = await getUserWishlist();

            expect(result.data).toEqual([]);
            expect(result.error).toBeNull();
        });

        it('should handle Error object in wishlist catch', async () => {
            const wishlistFail = new Error('Wishlist Fail');
            (
                createBackendClient as jest.MockedFunction<typeof createBackendClient>
            ).mockRejectedValue(wishlistFail);

            const result = await getUserWishlist();

            expect(console.error).toHaveBeenCalledWith(
                `${UserServiceLogPrefix} Wishlist System Error:`,
                wishlistFail,
            );
            expect(result.error).toBe('Sanitized: Wishlist Fail');
        });

        it('should handle non-Error in wishlist catch', async () => {
            (
                createBackendClient as jest.MockedFunction<typeof createBackendClient>
            ).mockRejectedValue(null);

            const result = await getUserWishlist();

            expect(console.error).toHaveBeenCalledWith(
                `${UserServiceLogPrefix} Wishlist System Error:`,
                null,
            );
            expect(result.error).toBe('Sanitized error');
        });

        it('should return data on success', async () => {
            const mockWishlist = [{ id: 'w1', book_id: 'b1' }];
            (
                fetchWishlistByUserId as jest.MockedFunction<typeof fetchWishlistByUserId>
            ).mockResolvedValue({
                data: mockWishlist,
                error: null,
            } as unknown as Awaited<ReturnType<typeof fetchWishlistByUserId>>);

            const result = await getUserWishlist();

            expect(result.data).toEqual(mockWishlist);
            expect(result.error).toBeNull();
        });
    });
});
