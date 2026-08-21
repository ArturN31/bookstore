import {
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/cart/CartRepository');
jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));

jest.mock('@/data/cart/CartServiceUtils', () => {
    const actual = jest.requireActual<typeof import('@/data/cart/CartServiceUtils')>(
        '@/data/cart/CartServiceUtils',
    );
    return {
        ...actual,
        handleItemMutation: jest.fn(
            async (
                _operationName: string,
                _cartID: string,
                _bookID: string,
                mutationFn: (client: unknown) => Promise<unknown>,
            ) => {
                return mutationFn({});
            },
        ),
    };
});

type SanitizeFn = (err: unknown) => string;

const defaultSanitizeImplementation: SanitizeFn = (err: unknown): string => {
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

describe('CartService Item Mutations (addItem, updateItem, removeItem)', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const validCartID = '123e4567-e89b-12d3-a456-426614174000';
    const validBookID = '987e6543-e21b-12d3-a456-426614174000';

    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (
            sanitizeSupabaseError as jest.MockedFunction<typeof sanitizeSupabaseError>
        ).mockImplementation(defaultSanitizeImplementation);
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
    });

    describe('item mutation wrapper functions', () => {
        describe('addItemToUsersCart', () => {
            it('should return error for invalid quantity less than 1', async () => {
                const result = await addItemToUsersCart(validCartID, validBookID, 0);

                expect(result).toEqual({
                    data: false,
                    error: APP_ERROR_MESSAGES.INVALID_QUANTITY,
                });
            });

            it('should successfully add item when quantity is valid', async () => {
                (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                    data: true,
                    error: null,
                } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

                const result = await addItemToUsersCart(validCartID, validBookID, 2);

                expect(Repo.upsertItem).toHaveBeenCalledWith(
                    expect.any(Object),
                    validCartID,
                    validBookID,
                    2,
                );
                expect(result).toEqual({
                    data: true,
                    error: null,
                });
            });

            it('should handle error when mutation fails', async () => {
                (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                    data: null,
                    error: 'Add failed',
                } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

                const result = await addItemToUsersCart(validCartID, validBookID, 2);

                expect(result).toEqual({
                    data: null,
                    error: 'Add failed',
                });
            });
        });

        describe('updateItemInUsersCart', () => {
            it('should return error for invalid quantity less than 1', async () => {
                const result = await updateItemInUsersCart(validCartID, validBookID, 0);

                expect(result).toEqual({
                    data: false,
                    error: APP_ERROR_MESSAGES.INVALID_QUANTITY,
                });
            });

            it('should successfully update item', async () => {
                (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                    data: true,
                    error: null,
                } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

                const result = await updateItemInUsersCart(validCartID, validBookID, 3);

                expect(Repo.updateItem).toHaveBeenCalledWith(
                    expect.any(Object),
                    validCartID,
                    validBookID,
                    3,
                );
                expect(result).toEqual({
                    data: true,
                    error: null,
                });
            });

            it('should handle error when update mutation fails', async () => {
                (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                    data: null,
                    error: 'Update failed',
                } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

                const result = await updateItemInUsersCart(validCartID, validBookID, 3);

                expect(result).toEqual({
                    data: null,
                    error: 'Update failed',
                });
            });
        });

        describe('removeItemFromUsersCart', () => {
            it('should successfully remove item', async () => {
                (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                    data: true,
                    error: null,
                } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

                const result = await removeItemFromUsersCart(validCartID, validBookID);

                expect(Repo.deleteItem).toHaveBeenCalledWith(
                    expect.any(Object),
                    validCartID,
                    validBookID,
                );
                expect(result).toEqual({
                    data: true,
                    error: null,
                });
            });

            it('should handle error when remove mutation fails', async () => {
                (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                    data: null,
                    error: 'Remove failed',
                } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

                const result = await removeItemFromUsersCart(validCartID, validBookID);

                expect(result).toEqual({
                    data: null,
                    error: 'Remove failed',
                });
            });
        });
    });
});
