import { findUserById, findWishlistByUserId, findFullWishlistByUserId } from '@/data/user/UserRepository';

describe('UserRepository', () => {
    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findUserById', () => {
        it('should query users table for user id', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

            await findUserById(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.select).toHaveBeenCalledWith('*');
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
            expect(mockSupabase.maybeSingle).toHaveBeenCalled();
        });

        it('should return user data when found', async () => {
            const userData = { id: 'user-123', username: 'testuser' };
            mockSupabase.maybeSingle.mockResolvedValue({ data: userData, error: null });

            const result = await findUserById(mockSupabase, 'user-123');

            expect(result.data).toEqual(userData);
        });
    });

    describe('findWishlistByUserId', () => {
        it('should query wishlist table for user id', async () => {
            mockSupabase.eq.mockResolvedValue({ data: [], error: null });

            await findWishlistByUserId(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.select).toHaveBeenCalledWith('*');
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('should return wishlist items', async () => {
            const wishlistItems = [{ id: '1', book_id: 'book-1' }];
            mockSupabase.eq.mockResolvedValue({ data: wishlistItems, error: null });

            const result = await findWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toEqual(wishlistItems);
        });
    });

    describe('findFullWishlistByUserId', () => {
        it('should query wishlist with book details', async () => {
            mockSupabase.eq.mockResolvedValue({ data: [], error: null });

            await findFullWishlistByUserId(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
        });

        it('should return wishlist with book details', async () => {
            const wishlistItems = [
                { id: '1', book_id: 'book-1', bookDetails: { title: 'Test Book' } },
            ];
            mockSupabase.eq.mockResolvedValue({ data: wishlistItems, error: null });

            const result = await findFullWishlistByUserId(mockSupabase, 'user-123');

            expect(result.data).toEqual(wishlistItems);
        });
    });
});
