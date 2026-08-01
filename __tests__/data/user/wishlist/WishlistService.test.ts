import { executeWishlistOperation } from '@/data/user/wishlist/WishlistService';
import { createBackendClient } from '@/utils/db/server';
import { withRetry } from '@/utils/network/retry';

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

describe('WishlistService', () => {
    let mockSupabase: MockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn(),
            insert: jest.fn(),
            delete: jest.fn(),
            eq: jest.fn(),
            select: jest.fn(),
        };

        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockReturnValue(mockSupabase);
        mockSupabase.delete.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
    });

    it('should execute INSERT operation successfully', async () => {
        mockSupabase.select.mockResolvedValueOnce({
            data: [{ user_id: 'user-123', book_id: 'book-1' }],
            error: null,
        });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should execute REMOVE operation successfully', async () => {
        mockSupabase.select.mockResolvedValueOnce({
            data: [{ user_id: 'user-123', book_id: 'book-1' }],
            error: null,
        });

        const result = await executeWishlistOperation('REMOVE', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should return error for unsupported operation type', async () => {
        const result = await executeWishlistOperation(
            'INVALID_OP' as unknown as 'INSERT',
            'user-123',
            'book-1',
        );

        expect(result.data).toBeNull();
        expect(result.error).toBe('Unsupported wishlist action.');
    });

    it('should handle INSERT operation error (DB level)', async () => {
        mockSupabase.select.mockResolvedValueOnce({
            data: null,
            error: { message: 'Insert failed' },
        });

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('Insert failed');
    });

    it('should handle INSERT operation error (Catch block / Timeout)', async () => {
        (withRetry as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        const result = await executeWishlistOperation('INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('An unexpected error occurred. We are looking into it.');
    });
});
