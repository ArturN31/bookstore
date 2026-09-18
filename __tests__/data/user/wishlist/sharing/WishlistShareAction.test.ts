import { updateWishlistVisibilityAction } from '@/data/user/wishlist/sharing/WishlistShareAction';
import { updateWishlistVisibilityAndToken } from '@/data/user/wishlist/sharing/WishlistShareRepository';
import { revalidatePath } from 'next/cache';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';

const mockGetUser = jest.fn();

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(() =>
        Promise.resolve({
            auth: {
                getUser: mockGetUser,
            },
        }),
    ),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) =>
        err instanceof Error ? err.message : 'Failed to update visibility',
    ),
}));

jest.mock('@/data/user/wishlist/sharing/WishlistShareRepository', () => ({
    updateWishlistVisibilityAndToken: jest.fn(),
}));

describe('WishlistShareAction', () => {
    const mockUpdateWishlistVisibilityAndToken =
        updateWishlistVisibilityAndToken as jest.MockedFunction<
            typeof updateWishlistVisibilityAndToken
        >;
    const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
    });

    it('should return unauthenticated error when user is not logged in', async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: null },
            error: new Error('Auth session missing'),
        });

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(result).toEqual({ error: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER });
        expect(mockUpdateWishlistVisibilityAndToken).not.toHaveBeenCalled();
    });

    it('should return unauthorized error when active user ID does not match target user ID', async () => {
        mockGetUser.mockResolvedValueOnce({
            data: { user: { id: 'different-user-456' } },
            error: null,
        });

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(result).toEqual({ error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS });
        expect(mockUpdateWishlistVisibilityAndToken).not.toHaveBeenCalled();
    });

    it('should successfully update wishlist visibility to public without a token', async () => {
        mockUpdateWishlistVisibilityAndToken.mockResolvedValue({ error: null });

        const result = await updateWishlistVisibilityAction('user-123', true);

        expect(mockUpdateWishlistVisibilityAndToken).toHaveBeenCalledWith('user-123', true, null);
        expect(mockRevalidatePath).toHaveBeenCalledWith(
            '/user/profile/public/[username]',
            'layout',
        );
        expect(mockRevalidatePath).toHaveBeenCalledWith('/user/wishlist/[username]', 'layout');
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
