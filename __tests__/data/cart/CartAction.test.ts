import { CartAction } from '@/data/cart/CartAction';
import { getUserData } from '@/data/user/UserService';
import { ensureCartExists, executeCartOperation, clearUsersCart } from '@/data/cart/CartService';
import { revalidatePath } from 'next/cache';
import { cartSchema } from '@/data/schemas/cartSchema';
import { ZodError } from 'zod';
import { CART_SUCCESS_MESSAGES } from '@/data/cart/CartConstants';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

type MockedSafeParseReturn = ReturnType<typeof cartSchema.safeParse>;
type MockUser = NonNullable<Awaited<ReturnType<typeof getUserData>>['data']>;

jest.mock('@/data/user/UserService');
jest.mock('@/data/cart/CartService');
jest.mock('@/data/schemas/cartSchema');
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));
jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => `Sanitized: ${String(err)}`),
}));

const mockUser: MockUser = {
    id: 'user-123',
    email: 'test@example.com',
    city: 'Test City',
    country: 'Test Country',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    first_name: 'Test',
    last_name: 'User',
    postcode: '12345',
    street_address: '123 Test St',
    username: 'testuser',
    date_of_birth: '1990-01-01',
    phone_number: '1234567890',
};

describe('CartAction', () => {
    const mockedGetUserData = getUserData as jest.MockedFunction<typeof getUserData>;
    const mockedCartSchema = cartSchema as jest.Mocked<typeof cartSchema>;
    const mockedEnsureCartExists = ensureCartExists as jest.MockedFunction<typeof ensureCartExists>;
    const mockedExecuteCartOperation = executeCartOperation as jest.MockedFunction<
        typeof executeCartOperation
    >;
    const mockedClearUsersCart = clearUsersCart as jest.MockedFunction<typeof clearUsersCart>;
    const mockedSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetUserData.mockResolvedValue({ data: mockUser, error: null });

        mockedEnsureCartExists.mockImplementation(async (_userId: string) => {
            return { data: 'cart-123', error: null };
        });
        mockedExecuteCartOperation.mockImplementation(async (actionType: string) => {
            if (actionType === 'INSERT')
                return { data: true, error: null, message: 'Item added to your cart!' };
            if (actionType === 'UPDATE') return { data: true, error: null, message: 'Updated' };
            if (actionType === 'REMOVE') return { data: true, error: null, message: 'Removed' };
            return { data: null, error: 'Unsupported action' };
        });
        mockedClearUsersCart.mockResolvedValue({ data: true, error: null });
        mockedSanitizeSupabaseError.mockImplementation(
            (err: unknown) => `Sanitized: ${String(err)}`,
        );
    });

    const createFormData = (bookId: string, action: string, qty: string = '1') => {
        const formData = new FormData();
        formData.append('book-id', bookId);
        formData.append('book-quantity', qty);
        formData.append('action-type', action);
        return formData;
    };

    it('should return failure if validated.success is false', async () => {
        const structuralZodError = new ZodError([
            { code: 'custom', path: [], message: 'Invalid ID' },
        ]);

        mockedCartSchema.safeParse.mockReturnValue({
            success: false,
            error: structuralZodError,
        } as MockedSafeParseReturn);

        const formData = new FormData();
        const result = await CartAction(undefined, formData);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid cart request.');
    });

    it('should return failure if user is not logged in', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Not logged in' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toBe('Sanitized: Not logged in');
    });

    it('should return default authorization message if user is null and authError is null', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedGetUserData.mockResolvedValue({ data: null, error: null });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(result.message).toBe('Authorization required.');
    });

    it('should throw an error if createUsersCart returns false (Internal Error Throw)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        mockedEnsureCartExists.mockResolvedValue({ data: null, error: 'Create failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('should successfully retrieve cartID after newly creating a cart', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(true);
    });

    it('should return failure if cartID is still null after creation attempt', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedEnsureCartExists.mockResolvedValueOnce({ data: null, error: 'Create failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
    });

    it('should return failure message when addItemToUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-111', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedExecuteCartOperation.mockResolvedValue({ data: null, error: 'Add failed' });

        const result = await CartAction(undefined, createFormData('book-111', 'INSERT'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return failure message when updateItemInUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-456', bookQuantity: 3, actionType: 'UPDATE' },
        } as MockedSafeParseReturn);
        mockedExecuteCartOperation.mockResolvedValue({ data: null, error: 'Update failed' });

        const result = await CartAction(undefined, createFormData('book-456', 'UPDATE', '3'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return failure message when removeItemFromUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-789', bookQuantity: 1, actionType: 'REMOVE' },
        } as MockedSafeParseReturn);
        mockedExecuteCartOperation.mockResolvedValue({ data: null, error: 'Remove failed' });

        const result = await CartAction(undefined, createFormData('book-789', 'REMOVE'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should cover the INSERT happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(true);
        expect(revalidatePath).toHaveBeenCalled();
    });

    it('should cover the UPDATE happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 5, actionType: 'UPDATE' },
        } as MockedSafeParseReturn);

        const result = await CartAction(undefined, createFormData('b1', 'UPDATE', '5'));
        expect(result.success).toBe(true);
    });

    it('should cover the REMOVE happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'REMOVE' },
        } as MockedSafeParseReturn);

        const result = await CartAction(undefined, createFormData('b1', 'REMOVE'));
        expect(result.success).toBe(true);
    });

    it('should cover the CLEAR happy path and break', async () => {
        mockedClearUsersCart.mockResolvedValue({ data: true, error: null });

        const result = await CartAction(undefined, createFormData('', 'CLEAR'));

        expect(result.success).toBe(true);
        expect(result.message).toBe(CART_SUCCESS_MESSAGES.CLEAR);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('should return failure message when clearUsersCart returns an error', async () => {
        mockedClearUsersCart.mockResolvedValue({ data: null, error: 'Clear failed' });

        const result = await CartAction(undefined, createFormData('', 'CLEAR'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sanitized: Clear failed');
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle generic catch-block rejections (The catch err branch)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedEnsureCartExists.mockRejectedValue(new Error('Network Fail'));

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();
        expect(result.message).toBe('Sanitized: Error: Network Fail');
        consoleSpy.mockRestore();
    });

    it('should return error when authError exists', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Auth failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sanitized: Auth failed');
    });

    it('should return error message from cartContext.error when it exists', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedEnsureCartExists.mockResolvedValue({ data: null, error: 'Cart lookup failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sanitized: Cart lookup failed');
    });

    it('BRANCH COVERAGE: should handle missing cartContext data when error is empty string (fallback message)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        mockedEnsureCartExists.mockResolvedValue({
            data: null,
            error: '',
        });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Cart initialization failed.');
    });

    it('BRANCH COVERAGE: should return sanitized error message when cartContext.error is a non-empty string', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        mockedEnsureCartExists.mockResolvedValue({
            data: null,
            error: 'Database initialization error',
        });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Sanitized: Database initialization error');
    });

    it('BRANCH COVERAGE: should return "Cart updated successfully." fallback message when result.message is completely missing', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        mockedExecuteCartOperation.mockResolvedValue({
            data: true,
            error: null,
            message: undefined,
        });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(true);
        expect(result.message).toBe('Cart updated successfully.');
    });
});
