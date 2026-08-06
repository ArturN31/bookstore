import { WishlistAction } from '@/data/user/wishlist/WishlistAction';
import { getUserData } from '@/data/user/UserService';
import { wishlistSchema } from '@/data/schemas/wishlistSchema';
import { revalidatePath } from 'next/cache';
import { executeWishlistOperation } from '@/data/user/wishlist/WishlistService';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

jest.mock('@/data/user/UserService');
jest.mock('@/data/schemas/wishlistSchema');
jest.mock('@/data/user/wishlist/WishlistService');
jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler', () => {
    const actual = jest.requireActual('@/utils/errors/SupabaseErrorHandler');
    return {
        ...actual,
        sanitizeSupabaseError: jest.fn((err: unknown) => {
            if (!err) return null;
            if (err instanceof Error) return 'A system error occurred. Please try again.';
            if (typeof err === 'string') return err;
            return 'Sanitized error';
        }),
    };
});
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('WishlistAction', () => {
    const mockedGetUserData = getUserData as jest.MockedFunction<typeof getUserData>;
    const mockedExecuteWishlistOperation = executeWishlistOperation as jest.MockedFunction<
        typeof executeWishlistOperation
    >;
    const mockedWishlistSchema = wishlistSchema as unknown as { safeParse: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();

        mockedGetUserData.mockResolvedValue({
            data: { id: 'user-123', email: 'test@test.com' } as unknown as NonNullable<
                Awaited<ReturnType<typeof getUserData>>['data']
            >,
            error: null,
        });

        mockedWishlistSchema.safeParse.mockImplementation(
            (data: { bookId: string; actionType: string }) => ({
                success: true,
                data: { bookId: data.bookId, actionType: data.actionType },
            }),
        );

        mockedExecuteWishlistOperation.mockResolvedValue({
            data: true,
            message: 'Success',
            error: null,
        });
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

    it('should return failure if user is not logged in due to session expiration', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: null });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/login required/i);
        expect(recordSecurityAuditLog).toHaveBeenCalledWith('FAILED_AUTHENTICATION_ATTEMPT', null, {
            operation: 'WishlistAction_auth_failed',
            error: 'Session expired',
        });
    });

    it('should return failure if user is not logged in due to authError', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Database Auth Error' });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toBe('Database Auth Error');
        expect(recordSecurityAuditLog).toHaveBeenCalledWith('FAILED_AUTHENTICATION_ATTEMPT', null, {
            operation: 'WishlistAction_auth_failed',
            error: 'Database Auth Error',
        });
    });

    it('should successfully add item to wishlist and revalidate path', async () => {
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(mockedExecuteWishlistOperation).toHaveBeenCalledWith('INSERT', 'user-123', 'b1');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(result.success).toBe(true);
    });

    it('should use fallback success message for INSERT when result.message is empty', async () => {
        mockedExecuteWishlistOperation.mockResolvedValue({
            data: true,
            message: '',
            error: null,
        });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(true);
        expect(result.message).toBe('Item successfully added to wishlist.');
    });

    it('should return failure message when insertError exists', async () => {
        mockedExecuteWishlistOperation.mockResolvedValue({
            data: null,
            message: '',
            error: 'DB Error',
        });
        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });

    it('should successfully remove item from wishlist and revalidate path', async () => {
        const result = await WishlistAction(undefined, createFormData('b1', 'REMOVE'));
        expect(mockedExecuteWishlistOperation).toHaveBeenCalledWith('REMOVE', 'user-123', 'b1');
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
        expect(result.success).toBe(true);
    });

    it('should use fallback success message for REMOVE when result.message is empty', async () => {
        mockedExecuteWishlistOperation.mockResolvedValue({
            data: true,
            message: '',
            error: null,
        });
        const result = await WishlistAction(undefined, createFormData('b1', 'REMOVE'));
        expect(result.success).toBe(true);
        expect(result.message).toBe('Item successfully removed from wishlist.');
    });

    it('should return failure message when removeError exists', async () => {
        mockedExecuteWishlistOperation.mockResolvedValue({
            data: null,
            message: '',
            error: 'Delete Fail',
        });
        const result = await WishlistAction(undefined, createFormData('b1', 'REMOVE'));
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });

    it('should catch unhandled exceptions and return a system error message', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const mockError = new Error('Simulated system failure');
        mockedGetUserData.mockRejectedValueOnce(mockError);

        const result = await WishlistAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('A system error occurred. Please try again.');
        expect(consoleSpy).toHaveBeenCalledWith('[WishlistAction] Pipeline Failure:', mockError);

        consoleSpy.mockRestore();
    });
});
