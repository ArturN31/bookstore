import { removeFromWishlist } from '@/data/user/wishlist/WishlistRepository';
import { withRetry } from '@/utils/network/retry';
import { createBackendClient } from '@/utils/db/server';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(),
}));

describe('WishlistRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('removeFromWishlist - Error Handling', () => {
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
