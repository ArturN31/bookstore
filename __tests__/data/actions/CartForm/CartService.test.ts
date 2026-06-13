import { ensureCartExists, executeCartOperation } from '@/data/actions/CartForm/CartService';
import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/GetCartData';

jest.mock('@/data/cart/GetCartData');

describe('CartService', () => {
    const mockedGetUsersCartID = getUsersCartID as jest.Mock;
    const mockedCreateUsersCart = createUsersCart as jest.Mock;
    const mockedAddItem = addItemToUsersCart as jest.Mock;
    const mockedUpdateItem = updateItemInUsersCart as jest.Mock;
    const mockedRemoveItem = removeItemFromUsersCart as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ensureCartExists', () => {
        it('should return cart ID when user has existing cart', async () => {
            mockedGetUsersCartID.mockResolvedValue({ data: 'cart-123', error: null });

            const result = await ensureCartExists('user-123');

            expect(result).toEqual({ data: 'cart-123', error: null });
        });

        it('should return error when getUsersCartID returns error (covers line 11)', async () => {
            mockedGetUsersCartID.mockResolvedValue({ data: null, error: 'Lookup failed' });

            const result = await ensureCartExists('user-123');

            expect(result).toEqual({ data: null, error: 'Lookup failed' });
        });

        it('should create new cart when user has no existing cart (covers line 14)', async () => {
            mockedGetUsersCartID.mockResolvedValue({ data: null, error: null });
            mockedCreateUsersCart.mockResolvedValue({ data: 'new-cart-123', error: null });

            const result = await ensureCartExists('user-123');

            expect(result).toEqual({ data: 'new-cart-123', error: null });
            expect(mockedCreateUsersCart).toHaveBeenCalledWith('user-123');
        });
    });

    describe('executeCartOperation', () => {
        it('should execute INSERT operation successfully', async () => {
            mockedAddItem.mockResolvedValue({ data: true, error: null });

            const result = await executeCartOperation('INSERT', 'cart-123', 'book-1', 1);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe('Item added to your cart!');
        });

        it('should execute UPDATE operation successfully', async () => {
            mockedUpdateItem.mockResolvedValue({ data: true, error: null });

            const result = await executeCartOperation('UPDATE', 'cart-123', 'book-1', 2);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe('Cart quantity updated.');
        });

        it('should execute REMOVE operation successfully', async () => {
            mockedRemoveItem.mockResolvedValue({ data: true, error: null });

            const result = await executeCartOperation('REMOVE', 'cart-123', 'book-1', 1);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe('Item removed from your cart.');
        });

        it('should return error for unknown operation type (covers line 40)', async () => {
            const result = await executeCartOperation('UNKNOWN_TYPE', 'cart-123', 'book-1', 1);

            expect(result.data).toBeNull();
            expect(result.error).toBe('Unsupported action type.');
        });

        it('should return operation error when operation fails (covers line 44)', async () => {
            mockedAddItem.mockResolvedValue({ data: null, error: 'Add failed' });

            const result = await executeCartOperation('INSERT', 'cart-123', 'book-1', 1);

            expect(result.error).toBe('Add failed');
            expect(result.message).toBeUndefined();
        });

        it('BRANCH COVERAGE: should use fallback message when SUCCESS_MESSAGES[type] is undefined (covers line 48 || branch)', async () => {
            let interceptorActive = true;
            const mockOperationFn = jest.fn().mockResolvedValue({ data: true, error: null });

            Object.defineProperty(Object.prototype, 'DYNAMIC_FALLBACK_TEST', {
                get() {
                    if (interceptorActive) {
                        interceptorActive = false;
                        return mockOperationFn;
                    }
                    return undefined;
                },
                configurable: true,
            });

            try {
                const result = await executeCartOperation(
                    'DYNAMIC_FALLBACK_TEST',
                    'cart-123',
                    'book-1',
                    1,
                );

                expect(mockOperationFn).toHaveBeenCalledWith('cart-123', 'book-1', 1);
                expect(result.data).toBe(true);
                expect(result.error).toBeNull();
                expect(result.message).toBe('Cart updated successfully.');
            } finally {
                Reflect.deleteProperty(Object.prototype, 'DYNAMIC_FALLBACK_TEST');
            }
        });
    });
});
