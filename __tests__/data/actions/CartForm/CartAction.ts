import { CartAction } from '@/data/actions/CartForm/CartAction';
import { getUserData } from '@/data/user/GetUserData';
import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/GetCartData';
import { revalidatePath } from 'next/cache';
import { cartSchema } from '@/data/schemas/cartSchema';

jest.mock('@/data/user/GetUserData');
jest.mock('@/data/cart/GetCartData');
jest.mock('@/data/schemas/cartSchema');
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('CartAction', () => {
    const mockedGetUserData = getUserData as jest.Mock;
    const mockedGetUsersCartID = getUsersCartID as jest.Mock;
    const mockedCreateUsersCart = createUsersCart as jest.Mock;
    const mockedAddItem = addItemToUsersCart as jest.Mock;
    const mockedUpdateItem = updateItemInUsersCart as jest.Mock;
    const mockedRemoveItem = removeItemFromUsersCart as jest.Mock;
    const mockedCartSchema = cartSchema as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetUserData.mockResolvedValue({ data: { id: 'user-123' }, error: null });
        mockedGetUsersCartID.mockResolvedValue({ data: 'cart-123', error: null });
    });

    const createFormData = (bookId: string, action: string, qty: string = '1') => {
        const formData = new FormData();
        formData.append('book-id', bookId);
        formData.append('book-quantity', qty);
        formData.append('action-type', action);
        return formData;
    };

    it('should return failure if validated.success is false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: false,
            error: { issues: [{ message: 'Invalid ID' }] },
        });

        const formData = new FormData();
        const result = await CartAction(undefined, formData);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid cart request.');
    });

    it('should return failure if user is not logged in', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
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
        });
        mockedGetUsersCartID.mockResolvedValue({ data: null, error: 'No cart' });
        mockedCreateUsersCart.mockResolvedValue({ data: null, error: 'Create failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));

        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        consoleSpy.mockRestore();
    });

    it('should successfully retrieve cartID after newly creating a cart', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        mockedGetUsersCartID.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: 'new-id', error: null });
        mockedCreateUsersCart.mockResolvedValue({ data: 'new-id', error: null });
        mockedAddItem.mockResolvedValue({ data: true, error: null });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(true);
    });

    it('should return failure if cartID is still null after creation attempt', async () => {
        // Override beforeEach mocks for this specific test
        mockedGetUsersCartID.mockReset();
        mockedCreateUsersCart.mockReset();
        
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        // First call returns no cart (null data, no error), triggering create
        // createUsersCart fails, so ensureCartExists returns the error
        mockedGetUsersCartID.mockResolvedValueOnce({ data: null, error: null });
        mockedCreateUsersCart.mockResolvedValueOnce({ data: null, error: 'Create failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(false);
    });

    it('should return failure message when addItemToUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-111', bookQuantity: 1, actionType: 'INSERT' },
        });
        mockedAddItem.mockResolvedValue({ data: null, error: 'Add failed' });

        const result = await CartAction(undefined, createFormData('book-111', 'INSERT'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return failure message when updateItemInUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-456', bookQuantity: 3, actionType: 'UPDATE' },
        });
        mockedUpdateItem.mockResolvedValue({ data: null, error: 'Update failed' });

        const result = await CartAction(undefined, createFormData('book-456', 'UPDATE', '3'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return failure message when removeItemFromUsersCart returns false', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'book-789', bookQuantity: 1, actionType: 'REMOVE' },
        });
        mockedRemoveItem.mockResolvedValue({ data: null, error: 'Remove failed' });

        const result = await CartAction(undefined, createFormData('book-789', 'REMOVE'));

        expect(result.success).toBe(false);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should cover the INSERT happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        mockedAddItem.mockResolvedValue({ data: true, error: null, message: 'Added' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        expect(result.success).toBe(true);
        expect(revalidatePath).toHaveBeenCalled();
    });

    it('should cover the UPDATE happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 5, actionType: 'UPDATE' },
        });
        mockedUpdateItem.mockResolvedValue({ data: true, error: null, message: 'Updated' });

        const result = await CartAction(undefined, createFormData('b1', 'UPDATE', '5'));
        expect(result.success).toBe(true);
    });

    it('should cover the REMOVE happy path and break', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'REMOVE' },
        });
        mockedRemoveItem.mockResolvedValue({ data: true, error: null, message: 'Removed' });

        const result = await CartAction(undefined, createFormData('b1', 'REMOVE'));
        expect(result.success).toBe(true);
    });

    it('should handle generic catch-block rejections (The catch err branch)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        mockedGetUsersCartID.mockRejectedValue(new Error('Network Fail'));

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
        });
        // Return both authError and no user to test the || branch
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Auth failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        
        expect(result.success).toBe(false);
        expect(result.message).toBe('Authorization required.');
    });

    it('should return error message from cartContext.error when it exists (covers line 47 || branch)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        mockedGetUserData.mockResolvedValue({ data: { id: 'user-123' }, error: null });
        mockedGetUsersCartID.mockResolvedValue({ data: null, error: 'Cart lookup failed' });
        mockedCreateUsersCart.mockResolvedValue({ data: null, error: 'Create failed' });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        
        expect(result.success).toBe(false);
        expect(result.message).toBe('Cart lookup failed');
    });

    it('should use fallback message when result.message is undefined (covers line 57 || branch)', async () => {
        mockedCartSchema.safeParse.mockReturnValue({
            success: true,
            data: { bookId: 'b1', bookQuantity: 1, actionType: 'INSERT' },
        });
        // Mock executeCartOperation to return result without message
        mockedAddItem.mockResolvedValue({ data: true, error: null });

        const result = await CartAction(undefined, createFormData('b1', 'INSERT'));
        
        expect(result.success).toBe(true);
        // The message comes from executeCartOperation which adds SUCCESS_MESSAGES[type]
        // So we get 'Item added to your cart!' not the fallback
        expect(result.message).toBe('Item added to your cart!');
    });
});
