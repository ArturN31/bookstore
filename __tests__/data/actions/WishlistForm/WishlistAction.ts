import { WishlistAction } from '@/data/actions/WishlistForm/WishlistAction';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import { wishlistSchema } from '@/data/schemas/wishlistSchema';
import { revalidatePath } from 'next/cache';

jest.mock('@/utils/db/server');
jest.mock('@/data/user/GetUserData');
jest.mock('@/data/schemas/wishlistSchema');
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('WishlistAction', () => {
    const mockedCreateBackendClient = createBackendClient as jest.Mock;
    const mockedGetUserData = getUserData as jest.Mock;
    const mockedWishlistSchema = wishlistSchema as any;

    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedCreateBackendClient.mockResolvedValue(mockSupabase);
        mockedGetUserData.mockResolvedValue({ data: { id: 'user-123' }, error: null });

        mockedWishlistSchema.safeParse.mockImplementation((data: any) => ({
            success: true,
            data: { bookId: data.bookId, actionType: data.actionType },
        }));

        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.insert.mockResolvedValue({ error: null });
        mockSupabase.delete.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockResolvedValue({ error: null });
    });

    const createFormData = (bookId: string, action: string) => {
        const formData = new FormData();
        formData.append('book-id', bookId);
        formData.append('action-type', action);
        return formData;
    };

    it('should return failure if validated.success is false', async () => {
        mockedWishlistSchema.safeParse.mockReturnValue({
            success: false,
            error: { issues: [{ message: 'Invalid ID' }] },
        });
        const result = await WishlistAction(undefined, new FormData());
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid wishlist request.');
    });

    it('should return failure if user is not logged in', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Not logged in' });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/login required/i);
    });

    it('should successfully add item to wishlist and break', async () => {
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
        expect(mockSupabase.insert).toHaveBeenCalledWith([{ user_id: 'user-123', book_id: 'b1' }]);
        expect(revalidatePath).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    it('should return failure message when insertError exists', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockSupabase.insert.mockResolvedValue({ error: { message: 'DB Error' } });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('should successfully remove item from wishlist and break', async () => {
        mockSupabase.delete.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        
        const result = await WishlistAction(undefined, createFormData('b1', 'REMOVE'));
        expect(mockSupabase.delete).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    it('should return failure message when removeError exists', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockSupabase.eq.mockReturnValueOnce(mockSupabase);
        mockSupabase.eq.mockResolvedValueOnce({ error: { message: 'Delete Fail' } });
        const result = await WishlistAction(undefined, createFormData('b1', 'REMOVE'));
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('should handle generic catch-block rejections', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockSupabase.from.mockImplementationOnce(() => {
            throw new Error('Database Connection Crash');
        });

        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/system error/i);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
