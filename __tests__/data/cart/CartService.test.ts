import {
    getUsersCartID,
    createUsersCart,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
    getCartData,
} from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { mapDatabaseCartToDomain, CartItem } from '@/data/cart/CartMapper';
import { revalidateTag } from 'next/cache';
import { sanitizeSupabaseError, APP_ERROR_MESSAGES } from '@/utils/errors/SupabaseErrorHandler';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/cart/CartRepository');
jest.mock('@/data/cart/CartMapper');
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/errors/SupabaseErrorHandler', () => {
    const actual = jest.requireActual<typeof import('@/utils/errors/SupabaseErrorHandler')>(
        '@/utils/errors/SupabaseErrorHandler',
    );
    return {
        ...actual,
        sanitizeSupabaseError: jest.fn((err: unknown) => {
            if (typeof err === 'string') return `Sanitized: ${err}`;
            if (
                err &&
                typeof err === 'object' &&
                'message' in err &&
                typeof (err as { message: unknown }).message === 'string'
            ) {
                return `Sanitized: ${(err as { message: string }).message}`;
            }
            if (err instanceof Error) {
                return `Sanitized: ${err.message}`;
            }
            return 'Sanitized error';
        }),
    };
});

describe('CartService', () => {
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
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
    });

    describe('getUsersCartID', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await getUsersCartID('invalid-id');

            expect(result).toEqual({ data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION });
        });

        it('should handle unauthenticated session or auth error', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Auth session missing' },
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await getUsersCartID(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await getUsersCartID(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });
        });

        it('should return cart ID when found', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: { id: 'cart-123' },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const result = await getUsersCartID(validUUID);

            expect(result.data).toBe('cart-123');
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.findCartIdByUserId).toHaveBeenCalledWith(mockSupabase, validUUID);
        });

        it('should return null when repo returns "No data returned." error', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const result = await getUsersCartID(validUUID);

            expect(result.data).toBeNull();
            expect(result.error).toBeNull();
        });

        it('should handle database error', async () => {
            const dbError = { message: 'DB error', details: '', hint: '', code: '' };
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const result = await getUsersCartID(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: null, error: 'Sanitized: DB error' });
        });

        it('should handle connection timeout / exception', async () => {
            const timeoutErr = new Error('Timeout');
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockRejectedValue(timeoutErr);

            const result = await getUsersCartID(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(timeoutErr);
            expect(result).toEqual({ data: null, error: 'Sanitized: Timeout' });
        });
    });

    describe('createUsersCart', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await createUsersCart('invalid-id');

            expect(result).toEqual({ data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await createUsersCart(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });
        });

        it('should create cart and return ID', async () => {
            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: { id: 'new-cart' },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await createUsersCart(validUUID);

            expect(result.data).toBe('new-cart');
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.createCart).toHaveBeenCalledWith(mockSupabase, validUUID);
        });

        it('should handle no data and no error returned', async () => {
            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await createUsersCart(validUUID);

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART,
            });
        });

        it('should handle database error', async () => {
            const dbError = { message: 'Create failed', details: '', hint: '', code: '' };
            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: null,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await createUsersCart(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: null, error: 'Sanitized: Create failed' });
        });

        it('should handle connection timeout', async () => {
            const timeoutErr = new Error('Timeout');
            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockRejectedValue(
                timeoutErr,
            );

            const result = await createUsersCart(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(timeoutErr);
            expect(result).toEqual({ data: null, error: 'Sanitized: Timeout' });
        });
    });

    describe('addItemToUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await addItemToUsersCart('invalid-cart', validBookID, 1);
            expect(invalidCart).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });

            const invalidBook = await addItemToUsersCart(validCartID, 'invalid-book', 1);
            expect(invalidBook).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });
        });

        it('should return error for invalid quantity less than 1', async () => {
            const result = await addItemToUsersCart(validCartID, validBookID, 0);
            expect(result).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.INVALID_QUANTITY,
            });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await addItemToUsersCart(validCartID, validBookID, 1);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: false,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHENTICATED_USER}`,
            });
        });

        it('should add item successfully and revalidate tag', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.upsertItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 2);
            expect(revalidateTag).toHaveBeenCalledWith(`cart_${validCartID}`, 'max');
        });

        it('should handle database error', async () => {
            const dbError = { message: 'Add failed', details: '', hint: '', code: '' };
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: false,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: false, error: 'Sanitized: Add failed' });
        });

        it('should handle connection timeout', async () => {
            const timeoutErr = new Error('Timeout');
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockRejectedValue(
                timeoutErr,
            );

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(timeoutErr);
            expect(result).toEqual({ data: false, error: 'Sanitized: Timeout' });
        });
    });

    describe('updateItemInUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await updateItemInUsersCart('invalid-cart', validBookID, 2);
            expect(invalidCart).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });

            const invalidBook = await updateItemInUsersCart(validCartID, 'invalid-book', 2);
            expect(invalidBook).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: false,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHENTICATED_USER}`,
            });
        });

        it('should update item successfully and revalidate tag', async () => {
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.updateItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 3);
            expect(revalidateTag).toHaveBeenCalledWith(`cart_${validCartID}`, 'max');
        });

        it('should handle database error', async () => {
            const dbError = { message: 'Update failed', details: '', hint: '', code: '' };
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                data: false,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: false, error: 'Sanitized: Update failed' });
        });

        it('should handle network error', async () => {
            const networkErr = new Error('Network error');
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockRejectedValue(
                networkErr,
            );

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(networkErr);
            expect(result).toEqual({ data: false, error: 'Sanitized: Network error' });
        });
    });

    describe('removeItemFromUsersCart', () => {
        it('should return error for invalid cart or book UUID format', async () => {
            const invalidCart = await removeItemFromUsersCart('invalid-cart', validBookID);
            expect(invalidCart).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });

            const invalidBook = await removeItemFromUsersCart(validCartID, 'invalid-book');
            expect(invalidBook).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });
        });

        it('should handle unauthenticated session context', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: false,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHENTICATED_USER}`,
            });
        });

        it('should remove item successfully and revalidate tag', async () => {
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.deleteItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID);
            expect(revalidateTag).toHaveBeenCalledWith(`cart_${validCartID}`, 'max');
        });

        it('should handle database error', async () => {
            const dbError = { message: 'Remove failed', details: '', hint: '', code: '' };
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                data: false,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: false, error: 'Sanitized: Remove failed' });
        });

        it('should handle connection error', async () => {
            const connectionErr = new Error('Connection error');
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockRejectedValue(
                connectionErr,
            );

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(connectionErr);
            expect(result).toEqual({ data: false, error: 'Sanitized: Connection error' });
        });
    });

    describe('getCartData', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await getCartData('invalid-id');

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.SESSION_IDENTIFICATION_FAILED,
            });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await getCartData(validUUID);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[CartService] Pipeline Error:',
                expect.any(Error),
            );
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });

            consoleSpy.mockRestore();
        });

        it('should return default empty cart when repo error is "No data returned."', async () => {
            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockResolvedValue({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            } as unknown as Awaited<ReturnType<typeof Repo.fetchFullCartWithBooks>>);

            const result = await getCartData(validUUID);

            expect(result).toEqual({
                data: { cartID: null, books: [] },
                error: null,
            });
        });

        it('should return cart data with books', async () => {
            const mockCartData = { id: 'cart-123', books: [{ book_id: 'book-1', quantity: 2 }] };
            const mappedResult = { cartID: 'cart-123', books: [] as CartItem[] };

            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockResolvedValue({
                data: mockCartData,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.fetchFullCartWithBooks>>);
            (
                mapDatabaseCartToDomain as jest.MockedFunction<typeof mapDatabaseCartToDomain>
            ).mockReturnValue(mappedResult);

            const result = await getCartData(validUUID);

            expect(result.data).toEqual(mappedResult);
            expect(result.error).toBeNull();
            expect(createBackendClient).toHaveBeenCalled();
            expect(Repo.fetchFullCartWithBooks).toHaveBeenCalledWith(mockSupabase, validUUID);
            expect(mapDatabaseCartToDomain).toHaveBeenCalledWith(mockCartData);
        });

        it('should handle database error', async () => {
            const dbError = { message: 'Fetch failed', details: '', hint: '', code: '' };
            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockResolvedValue({
                data: null,
                error: dbError,
            } as unknown as Awaited<ReturnType<typeof Repo.fetchFullCartWithBooks>>);

            const result = await getCartData(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({ data: null, error: 'Sanitized: Fetch failed' });
        });

        it('should handle connection timeout / exception', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const timeoutErr = new Error('Timeout');
            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockRejectedValue(timeoutErr);

            const result = await getCartData(validUUID);

            expect(consoleSpy).toHaveBeenCalledWith(
                '[CartService] Pipeline Error:',
                expect.any(Error),
            );
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(timeoutErr);
            expect(result).toEqual({ data: null, error: 'Sanitized: Timeout' });

            consoleSpy.mockRestore();
        });
    });
});
