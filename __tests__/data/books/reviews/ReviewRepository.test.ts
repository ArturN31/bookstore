import { insertUserReview } from '@/data/books/reviews/ReviewRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { ReviewInsert } from '@/data/books/reviews/ReviewConstants';

describe('insertUserReview', () => {
    let mockInsert: jest.Mock;
    let mockFrom: jest.Mock;
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockInsert = jest.fn().mockResolvedValue({ error: null });
        mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
        mockSupabase = {
            from: mockFrom,
        } as unknown as SupabaseClient;
    });

    it('should successfully insert user review payload into book_reviews table', async () => {
        const payload: ReviewInsert = {
            book_id: 'book-123',
            user_id: 'user-123',
            username: 'testuser',
            rating: 5,
            review: 'Amazing book!',
        };

        const result = await insertUserReview(mockSupabase, payload);

        expect(mockFrom).toHaveBeenCalledWith('book_reviews');
        expect(mockInsert).toHaveBeenCalledWith({
            book_id: 'book-123',
            user_id: 'user-123',
            username: 'testuser',
            rating: 5,
            review: 'Amazing book!',
        });
        expect(result).toEqual({ error: null });
    });

    it('should return error object when database insertion fails', async () => {
        const dbError = { message: 'Insert failed', code: '500' };
        mockInsert.mockResolvedValueOnce({ error: dbError });

        const payload: ReviewInsert = {
            book_id: 'book-123',
            user_id: 'user-123',
            username: 'testuser',
            rating: 4,
            review: 'Good book!',
        };

        const result = await insertUserReview(mockSupabase, payload);

        expect(mockFrom).toHaveBeenCalledWith('book_reviews');
        expect(mockInsert).toHaveBeenCalledWith({
            book_id: 'book-123',
            user_id: 'user-123',
            username: 'testuser',
            rating: 4,
            review: 'Good book!',
        });
        expect(result).toEqual({ error: dbError });
    });
});
