import { addToWishlist, removeFromWishlist } from '@/data/user/wishlist/WishlistRepository';
import { withRetry } from '@/utils/network/retry';
import { createBackendClient } from '@/utils/db/server';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn((fn: () => unknown) => fn()),
}));

interface MockSupabaseClient {
    from: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    select: jest.Mock;
}

describe('WishlistRepository', () => {
    let mockSupabase: MockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn(),
        };

        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    afterEach(() => {
        (console.error as jest.Mock<unknown, unknown[]>).mockRestore();
        (console.warn as jest.Mock<unknown, unknown[]>).mockRestore();
    });

    describe('addToWishlist', () => {
        it('should add item to wishlist successfully', async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ user_id: 'user-123', book_id: 'book-1' }],
                error: null,
            });

            const result = await addToWishlist('user-123', 'book-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.insert).toHaveBeenCalledWith([
                { user_id: 'user-123', book_id: 'book-1' },
            ]);
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should handle database error when adding to wishlist', async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: null,
                error: {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint "wishlist_pkey"',
                    details: 'Key (user_id, book_id)=(user-123, book-1) already exists.',
                    hint: null,
                },
            });

            const result = await addToWishlist('user-123', 'book-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.insert).toHaveBeenCalledWith([
                { user_id: 'user-123', book_id: 'book-1' },
            ]);
            expect(result.data).toBeNull();
            expect(result.error).toBe('This record already exists. Please use a different value.');
        });

        it('should handle catch block error when adding to wishlist', async () => {
            (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

            const result = await addToWishlist('user-123', 'book-1');

            expect(result.data).toBeNull();
            expect(result.error).toBe('An unexpected error occurred. We are looking into it.');
        });
    });

    describe('removeFromWishlist', () => {
        it('should remove item from wishlist successfully', async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ user_id: 'user-123', book_id: 'book-1' }],
                error: null,
            });

            const result = await removeFromWishlist('user-123', 'book-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockSupabase.eq).toHaveBeenCalledWith('book_id', 'book-1');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should handle database error when removing from wishlist', async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: null,
                error: {
                    code: '42P01',
                    message: 'relation "wishlist" does not exist',
                    details: '',
                    hint: null,
                },
            });

            const result = await removeFromWishlist('user-123', 'book-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockSupabase.eq).toHaveBeenCalledWith('book_id', 'book-1');
            expect(result.data).toBeNull();
            expect(result.error).toBe(
                'We encountered an issue processing your request. Please contact support.',
            );
        });

        it('should return connection timeout error when an exception is thrown', async () => {
            const mockError = new Error('Simulated network failure');
            (withRetry as jest.Mock).mockRejectedValueOnce(mockError);

            const result = await removeFromWishlist('user-123', 'book-1');

            expect(result.data).toBeNull();
            expect(result.error).toBe('An unexpected error occurred. We are looking into it.');

            expect(withRetry).toHaveBeenCalledTimes(1);
            expect(createBackendClient).not.toHaveBeenCalled();
        });
    });
});
