import {
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError, APP_ERROR_MESSAGES } from '@/utils/errors/SupabaseErrorHandler';
import { revalidateTag } from 'next/cache';

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

const defaultSanitizeImplementation = (err: unknown): string => {
    if (typeof err === 'string') {
        if (err.startsWith('Sanitized: ')) return err;
        return `Sanitized: ${err}`;
    }
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
};

jest.mock('@/utils/errors/SupabaseErrorHandler', () => {
    const actual = jest.requireActual<typeof import('@/utils/errors/SupabaseErrorHandler')>(
        '@/utils/errors/SupabaseErrorHandler',
    );
    return {
        ...actual,
        sanitizeSupabaseError: jest.fn((err: unknown) => defaultSanitizeImplementation(err)),
    };
});

describe('CartService cart item actions', () => {
    const validCartID = '123e4567-e89b-12d3-a456-426614174000';
    const validBookID = '987e6543-e21b-12d3-a456-426614174000';

    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (sanitizeSupabaseError as unknown as jest.Mock).mockImplementation(
            defaultSanitizeImplementation,
        );
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '550e8400-e29b-41d4-a716-446655440000' } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
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

        it('should execute catch block when exception is thrown during addItemToUsersCart', async () => {
            const exceptionError = new Error('Critical failure in addItemToUsersCart');
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockRejectedValue(
                exceptionError,
            );

            const result = await addItemToUsersCart(validCartID, validBookID, 2);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: false,
                error: 'Sanitized: Critical failure in addItemToUsersCart',
            });
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

        it('should execute catch block when exception is thrown during updateItemInUsersCart', async () => {
            const exceptionError = new Error('Critical failure in updateItemInUsersCart');
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockRejectedValue(
                exceptionError,
            );

            const result = await updateItemInUsersCart(validCartID, validBookID, 3);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: false,
                error: 'Sanitized: Critical failure in updateItemInUsersCart',
            });
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

        it('should execute catch block when exception is thrown during removeItemFromUsersCart', async () => {
            const exceptionError = new Error('Critical failure in removeItemFromUsersCart');
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockRejectedValue(
                exceptionError,
            );

            const result = await removeItemFromUsersCart(validCartID, validBookID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: false,
                error: 'Sanitized: Critical failure in removeItemFromUsersCart',
            });
        });
    });
});
