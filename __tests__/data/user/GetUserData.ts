import { getUserData, getUserWishlist } from '@/data/user/GetUserData';
import { createBackendClient } from '@/utils/db/server';
import { findUserById, findWishlistByUserId } from '@/data/user/UserRepository';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/UserRepository');

// Mock withRetry to execute the callback
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

describe('GetUserData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserData', () => {
        it('should return user data when authenticated and profile exists', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: 'user-123', email: 'test@test.com' } },
                        error: null,
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findUserById as jest.Mock).mockResolvedValue({
                data: { id: 'user-123', username: 'testuser' },
                error: null,
            });

            const result = await getUserData();

            expect(result.data).toBeDefined();
            expect(result.data?.email).toBe('test@test.com');
            expect(result.error).toBeNull();
        });

        it('should return error when auth fails', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Not authenticated' },
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('User session not found.');
        });

        it('should return error when no auth user', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: null,
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('User session not found.');
        });

        it('should return error when database query fails', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findUserById as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
            });

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('Failed to retrieve profile data.');
        });

        it('should return null data when user profile not found (no error)', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: 'user-123' } },
                        error: null,
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findUserById as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });

        it('should handle unexpected error in catch block', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (createBackendClient as jest.Mock).mockRejectedValue(new Error('Unexpected'));

            const result = await getUserData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('A system error occurred or connection timed out.');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should merge auth email with user data', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: { id: 'user-123', email: 'merged@test.com' } },
                        error: null,
                    }),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findUserById as jest.Mock).mockResolvedValue({
                data: { id: 'user-123', username: 'testuser' },
                error: null,
            });

            const result = await getUserData();

            expect(result.data?.email).toBe('merged@test.com');
        });
    });

    describe('getUserWishlist', () => {
        it('should return error when no userID provided', async () => {
            const result = await getUserWishlist('');

            expect(result.data).toBeNull();
            expect(result.error).toBe('No user ID provided.');
        });

        it('should return wishlist when successful', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn(),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findWishlistByUserId as jest.Mock).mockResolvedValue({
                data: [{ id: '1', book_id: 'book-1' }],
                error: null,
            });

            const result = await getUserWishlist('user-123');

            expect(result.data).toHaveLength(1);
            expect(result.error).toBeNull();
        });

        it('should return empty array when no wishlist items', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn(),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findWishlistByUserId as jest.Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const result = await getUserWishlist('user-123');

            expect(result.data).toEqual([]);
            expect(result.error).toBeNull();
        });

        it('should return error when database query fails', async () => {
            const mockSupabase = {
                auth: {
                    getUser: jest.fn(),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findWishlistByUserId as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'Wishlist DB error' },
            });

            const result = await getUserWishlist('user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe('Could not load wishlist.');
        });

        it('should handle network error in catch block', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const mockSupabase = {
                auth: {
                    getUser: jest.fn(),
                },
            };
            (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
            (findWishlistByUserId as jest.Mock).mockRejectedValue(new Error('Network error'));

            const result = await getUserWishlist('user-123');

            expect(result.data).toBeNull();
            expect(result.error).toBe('Failed to fetch wishlist due to network issues.');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
