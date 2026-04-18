import { executeWishlistOperation } from '@/data/actions/WishlistForm/WishlistService';

describe('WishlistService', () => {
    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should execute INSERT operation successfully', async () => {
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockResolvedValue({ data: true, error: null });

        const result = await executeWishlistOperation(mockSupabase, 'INSERT', 'user-123', 'book-1');

        expect(result.data).toBe(true);
        expect(result.error).toBeNull();
    });

    it('should execute REMOVE operation successfully', async () => {
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.delete.mockReturnValue(mockSupabase);
        // eq is called twice for REMOVE (user_id and book_id)
        mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({ error: null });

        const result = await executeWishlistOperation(mockSupabase, 'REMOVE', 'user-123', 'book-1');

        expect(result.error).toBeNull();
    });

    it('should return error for unsupported operation type (covers line 24)', async () => {
        const result = await executeWishlistOperation(mockSupabase, 'INVALID_OP', 'user-123', 'book-1');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Unsupported wishlist action.');
    });

    it('should handle INSERT operation error', async () => {
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

        const result = await executeWishlistOperation(mockSupabase, 'INSERT', 'user-123', 'book-1');

        expect(result.error).toBe('Insert failed');
    });
});
