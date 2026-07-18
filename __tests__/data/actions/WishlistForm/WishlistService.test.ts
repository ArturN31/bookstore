import { executeWishlistOperation } from '@/data/actions/WishlistForm/WishlistService';
import { createBackendClient } from '@/utils/db/server';
import { withRetry } from '@/utils/network/retry';

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn((fn) => fn()),
}));

describe('WishlistService', () => {
    const mockSupabase: any = {
        from: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
        eq: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockReturnValue(mockSupabase);
        mockSupabase.delete.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
    });

    it('should execute INSERT operation successfully', async () => {
        mockSupabase.insert.mockResolvedValueOnce({ data: true, error: null });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should execute REMOVE operation successfully', async () => {
        mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({ error: null });

        const result = await executeWishlistOperation('REMOVE', 'user-123', 'book-1');

        expect(result.error).toBeNull();
    });

    it('should return error for unsupported operation type', async () => {
        const result = await executeWishlistOperation('INVALID_OP', 'user-123', 'book-1');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Unsupported wishlist action.');
    });

    it('should handle INSERT operation error (DB level)', async () => {
        mockSupabase.insert.mockResolvedValueOnce({
            data: null,
            error: { message: 'Insert failed' },
        });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('Unable to add to wishlist at this time.');
    });

    it('should handle INSERT operation error (Catch block / Timeout)', async () => {
        (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('Connection timeout. Please try again.');
    });
});
