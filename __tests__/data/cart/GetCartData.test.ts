import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
    getCartData,
} from '@/data/cart/GetCartData';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { mapDatabaseCartToDomain } from '@/data/cart/CartMapper';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/cart/CartRepository');
jest.mock('@/data/cart/CartMapper');
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

describe('GetCartData', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const otherValidUUID = '660e8400-e29b-41d4-a716-446655440000';
    const validCartID = '123e4567-e89b-12d3-a456-426614174000';
    const validBookID = '987e6543-e21b-12d3-a456-426614174000';

    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        });
    });

    describe('getUsersCartID', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await getUsersCartID('invalid-id');

            expect(result).toEqual({ data: null, error: 'User session is invalid.' });
        });

        it('should handle unauthenticated session or auth error', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Auth session missing' },
            });

            const result = await getUsersCartID(validUUID);

            expect(result.error).toBe('Connection timeout. Please try again.');
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            });

            const result = await getUsersCartID(validUUID);

            expect(result.error).toBe('Connection timeout. Please try again.');
        });

        it('should return cart ID when found', async () => {
            (Repo.findCartIdByUserId as jest.Mock).mockResolvedValue({
                data: { id: 'cart-123' },
                error: null,
            });

            const result = await getUsersCartID(validUUID);

            expect(result.data).toBe('cart-123');
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.findCartIdByUserId).toHaveBeenCalledWith(mockSupabase, validUUID);
        });

        it('should return null when no cart exists', async () => {
            (Repo.findCartIdByUserId as jest.Mock).mockResolvedValue({ data: null, error: null });

            const result = await getUsersCartID(validUUID);

            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.findCartIdByUserId as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'DB error', details: '', hint: '', code: '' },
            });

            const result = await getUsersCartID(validUUID);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to fetch cart');

            consoleSpy.mockRestore();
        });

        it('should handle connection timeout', async () => {
            (Repo.findCartIdByUserId as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await getUsersCartID(validUUID);

            expect(result.error).toBe('Connection timeout. Please try again.');
        });
    });

    describe('createUsersCart', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await createUsersCart('invalid-id');

            expect(result).toEqual({ data: null, error: 'User session is invalid.' });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            });

            const result = await createUsersCart(validUUID);

            expect(result.error).toBe('Failed to create cart due to connection issues.');
        });

        it('should create cart and return ID', async () => {
            (Repo.createCart as jest.Mock).mockResolvedValue({
                data: { id: 'new-cart' },
                error: null,
            });

            const result = await createUsersCart(validUUID);

            expect(result.data).toBe('new-cart');
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.createCart).toHaveBeenCalledWith(mockSupabase, validUUID);
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.createCart as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'Create failed', details: '', hint: '', code: '' },
            });

            const result = await createUsersCart(validUUID);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to create cart');

            consoleSpy.mockRestore();
        });

        it('should handle connection timeout', async () => {
            (Repo.createCart as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await createUsersCart(validUUID);

            expect(result.error).toBe('Failed to create cart due to connection issues.');
        });
    });

    describe('addItemToUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await addItemToUsersCart('invalid-cart', validBookID, 1);
            expect(invalidCart).toEqual({ data: false, error: 'Malformed identifier parameters.' });

            const invalidBook = await addItemToUsersCart(validCartID, 'invalid-book', 1);
            expect(invalidBook).toEqual({ data: false, error: 'Malformed identifier parameters.' });
        });

        it('should return error for invalid quantity less than 1', async () => {
            const result = await addItemToUsersCart(validCartID, validBookID, 0);
            expect(result).toEqual({ data: false, error: 'Invalid quantity assignment.' });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            const result = await addItemToUsersCart(validCartID, validBookID, 1);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Could not add item. Connection timed out.');
        });

        it('should add item successfully', async () => {
            (Repo.upsertItem as jest.Mock).mockResolvedValue({ data: true, error: null });

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.upsertItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 2);
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.upsertItem as jest.Mock).mockResolvedValue({
                data: false,
                error: { message: 'Add failed', details: '', hint: '', code: '' },
            });

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to add item');

            consoleSpy.mockRestore();
        });

        it('should handle connection timeout', async () => {
            (Repo.upsertItem as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Could not add item. Connection timed out.');
        });
    });

    describe('updateItemInUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await updateItemInUsersCart('invalid-cart', validBookID, 2);
            expect(invalidCart).toEqual({ data: false, error: 'Malformed identifier parameters.' });

            const invalidBook = await updateItemInUsersCart(validCartID, 'invalid-book', 2);
            expect(invalidBook).toEqual({ data: false, error: 'Malformed identifier parameters.' });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Update failed due to network error.');
        });

        it('should update item successfully', async () => {
            (Repo.updateItem as jest.Mock).mockResolvedValue({ data: true, error: null });

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.updateItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 3);
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.updateItem as jest.Mock).mockResolvedValue({
                data: false,
                error: { message: 'Update failed', details: '', hint: '', code: '' },
            });

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to update');

            consoleSpy.mockRestore();
        });

        it('should handle network error', async () => {
            (Repo.updateItem as jest.Mock).mockRejectedValue(new Error('Network error'));

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Update failed due to network error.');
        });
    });

    describe('removeItemFromUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await removeItemFromUsersCart('invalid-cart', validBookID);
            expect(invalidCart).toEqual({ data: false, error: 'Malformed identifier parameters.' });

            const invalidBook = await removeItemFromUsersCart(validCartID, 'invalid-book');
            expect(invalidBook).toEqual({ data: false, error: 'Malformed identifier parameters.' });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Removal failed. Check your connection.');
        });

        it('should remove item successfully', async () => {
            (Repo.deleteItem as jest.Mock).mockResolvedValue({ data: true, error: null });

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.deleteItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID);
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.deleteItem as jest.Mock).mockResolvedValue({
                data: false,
                error: { message: 'Remove failed', details: '', hint: '', code: '' },
            });

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to remove');

            consoleSpy.mockRestore();
        });

        it('should handle connection error', async () => {
            (Repo.deleteItem as jest.Mock).mockRejectedValue(new Error('Connection error'));

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Removal failed. Check your connection.');
        });
    });

    describe('getCartData', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await getCartData('invalid-id');

            expect(result).toEqual({ data: null, error: 'Session identification failed.' });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            });

            const result = await getCartData(validUUID);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[CartService] Pipeline Error:',
                expect.any(Error),
            );
            expect(result.error).toBe('Internal system error or connection timeout.');

            consoleSpy.mockRestore();
        });

        it('should return cart data with books', async () => {
            const mockCartData = { id: 'cart-123', books: [{ book_id: 'book-1', quantity: 2 }] };
            (Repo.fetchFullCartWithBooks as jest.Mock).mockResolvedValue({
                data: mockCartData,
                error: null,
            });
            (mapDatabaseCartToDomain as jest.Mock).mockReturnValue({
                cartID: 'cart-123',
                books: [],
            });

            const result = await getCartData(validUUID);

            expect(result.data).toEqual({ cartID: 'cart-123', books: [] });
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.fetchFullCartWithBooks).toHaveBeenCalledWith(mockSupabase, validUUID);
            expect(mapDatabaseCartToDomain).toHaveBeenCalledWith(mockCartData);
        });

        it('should handle database error', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.fetchFullCartWithBooks as jest.Mock).mockResolvedValue({
                data: null,
                error: { message: 'Fetch failed', details: '', hint: '', code: '' },
            });

            const result = await getCartData(validUUID);

            expect(consoleSpy).toHaveBeenCalled();
            expect(result.error).toContain('Unable to retrieve cart content');

            consoleSpy.mockRestore();
        });

        it('should handle connection timeout', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            (Repo.fetchFullCartWithBooks as jest.Mock).mockRejectedValue(new Error('Timeout'));

            const result = await getCartData(validUUID);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[CartService] Pipeline Error:',
                expect.any(Error),
            );
            expect(result.error).toBe('Internal system error or connection timeout.');

            consoleSpy.mockRestore();
        });
    });
});
