import { updateWishlistVisibilityAction } from '@/data/user/wishlist/sharing/WishlistShareAction';
import { updateWishlistVisibilityAndToken } from '@/data/user/wishlist/sharing/WishlistShareRepository';

jest.mock('@/data/user/wishlist/sharing/WishlistShareRepository', () => ({
    updateWishlistVisibilityAndToken: jest.fn(),
}));

describe('WishlistShareAction', () => {
    const mockUpdateWishlistVisibilityAndToken =
        updateWishlistVisibilityAndToken as jest.MockedFunction<
            typeof updateWishlistVisibilityAndToken
        >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update wishlist visibility to public without a token', async () => {
        mockUpdateWishlistVisibilityAndToken.mockResolvedValue({ error: null });

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(mockUpdateWishlistVisibilityAndToken).toHaveBeenCalledWith('user-123', true, null);
        expect(result).toEqual({ error: null });
    });

    it('should successfully update wishlist visibility to private with a new token', async () => {
        mockUpdateWishlistVisibilityAndToken.mockResolvedValue({ error: null });

        const result = await updateWishlistVisibilityAction('user-123', false, 'new-token-abc');

        expect(mockUpdateWishlistVisibilityAndToken).toHaveBeenCalledWith(
            'user-123',
            false,
            'new-token-abc',
        );
        expect(result).toEqual({ error: null });
    });

    it('should return error if repository returns an error string', async () => {
        mockUpdateWishlistVisibilityAndToken.mockResolvedValue({ error: 'Database error' });

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(result).toEqual({ error: 'Database error' });
    });

    it('should catch and format Error instances thrown by the repository', async () => {
        mockUpdateWishlistVisibilityAndToken.mockRejectedValue(new Error('Network failure'));

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(result).toEqual({ error: 'Network failure' });
    });

    it('should catch and return a default error message for non-Error throws', async () => {
        mockUpdateWishlistVisibilityAndToken.mockRejectedValue('Some string error');

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(result).toEqual({ error: 'Failed to update visibility' });
    });
});
