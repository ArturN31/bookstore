import { executeWishlistOperation } from '@/data/user/wishlist/WishlistService';
import { addToWishlist, removeFromWishlist } from '@/data/user/wishlist/WishlistRepository';

jest.mock('@/data/user/wishlist/WishlistRepository', () => ({
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
}));

describe('WishlistService', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock<unknown, unknown[]>).mockRestore();
        (console.warn as jest.Mock<unknown, unknown[]>).mockRestore();
    });

    it('should execute INSERT operation successfully', async () => {
        (addToWishlist as jest.Mock).mockResolvedValueOnce({
            data: true,
            error: null,
        });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
        expect(result.message).toBe('Item added to wishlist.');
    });

    it('should execute REMOVE operation successfully', async () => {
        (removeFromWishlist as jest.Mock).mockResolvedValueOnce({
            data: true,
            error: null,
        });

        const result = await executeWishlistOperation('REMOVE', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
        expect(result.message).toBe('Item removed from wishlist.');
    });

    it('should return error for unsupported operation type', async () => {
        const result = await executeWishlistOperation('INVALID_OP', 'user-123', 'book-1');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Unsupported wishlist action.');
    });

    it('should handle INSERT operation error (DB level / result.error)', async () => {
        (addToWishlist as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: { message: 'Insert failed' },
        });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('Insert failed');
    });

    it('should handle INSERT operation error (Catch block / Thrown exception)', async () => {
        (addToWishlist as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('An unexpected error occurred. We are looking into it.');
    });
});
