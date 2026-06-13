import { CartAction } from '@/data/actions/CartForm/CartAction';
import { getUserData } from '@/data/user/GetUserData';
import { getUsersCartID } from '@/data/cart/GetCartData';
import { revalidatePath } from 'next/cache';
import { cartSchema } from '@/data/schemas/cartSchema';
import { ZodError } from 'zod';
import { ensureCartExists, executeCartOperation } from '@/data/actions/CartForm/CartService';

type MockedSafeParseReturn = ReturnType<typeof cartSchema.safeParse>;

jest.mock('@/data/user/GetUserData');
jest.mock('@/data/cart/GetCartData');
jest.mock('@/data/schemas/cartSchema');
jest.mock('@/data/actions/CartForm/CartService', () => ({
    ensureCartExists: jest.fn(),
    executeCartOperation: jest.fn(),
}));
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('CartAction', () => {
    const mockedGetUserData = getUserData as jest.Mock;
    const mockedGetUsersCartID = getUsersCartID as jest.Mock;
    const mockedCartSchema = cartSchema as jest.Mocked<typeof cartSchema>;

    const mockedEnsureCartExists = ensureCartExists as jest.Mock;
    const mockedExecuteCartOperation = executeCartOperation as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetUserData.mockResolvedValue({ data: { id: 'user-123' }, error: null });
        mockedGetUsersCartID.mockResolvedValue({ data: 'cart-123', error: null });

        mockedEnsureCartExists.mockImplementation(async (userId: string) => {
            return { data: 'cart-123', error: null };
        });
        mockedExecuteCartOperation.mockImplementation(async (actionType: string) => {
            if (actionType === 'INSERT')
                return { data: true, error: null, message: 'Item added to your cart!' };
            if (actionType === 'UPDATE') return { data: true, error: null, message: 'Updated' };
            if (actionType === 'REMOVE') return { data: true, error: null, message: 'Removed' };
            return { data: null, error: 'Unsupported action' };
        });
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
        expect(result.message).toMatch(/authorization required/i);
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
        expect(result.message).toBe('A server error occurred while processing the cart.');
        consoleSpy.mockRestore();
    });

    it('should return error when authError exists (covers line 42 || branch)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Auth failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Authorization required.');
    });

    it('should return error message from cartContext.error when it exists (covers line 42 || branch left side)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);
        mockedEnsureCartExists.mockResolvedValue({ data: null, error: 'Cart lookup failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Cart lookup failed');
    });

    it('BRANCH COVERAGE: should return "Cart initialization failed." when cartContext.data is null and error is missing (covers line 42 fallback branch)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        } as MockedSafeParseReturn);

        mockedEnsureCartExists.mockResolvedValue({ data: null, error: null });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBe('Cart initialization failed.');
    });

    it('BRANCH COVERAGE: should return "Cart updated successfully." fallback message when result.message is completely missing (covers line 57 fallback branch)', async () => {
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
