import {
    getUsersCartID,
    createUsersCart,
    getCartData,
    ensureCartExists,
    executeCartOperation,
    addItemToUsersCart,
    updateItemInUsersCart,
    removeItemFromUsersCart,
} from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { mapDatabaseCartToDomain, CartItem } from '@/data/cart/CartMapper';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { CART_OPERATION_TYPES, CART_SUCCESS_MESSAGES } from '@/data/cart/CartConstants';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/cart/CartRepository');
jest.mock('@/data/cart/CartMapper');
jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
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

jest.mock('@/data/cart/CartConstants', () => {
    const actual = jest.requireActual<typeof import('@/data/cart/CartConstants')>(
        '@/data/cart/CartConstants',
    );
    return {
        ...actual,
        CART_SUCCESS_MESSAGES: {
            ...actual.CART_SUCCESS_MESSAGES,
            REMOVE: undefined,
            DEFAULT: 'Default success message',
        },
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

describe('CartService cart data and helpers', () => {
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

    describe('getUsersCartID', () => {
        it('should return null data and null error when NO_DATA_RETURNED occurs', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const result = await getUsersCartID(validUUID);

            expect(result).toEqual({ data: null, error: null });
        });
    });

    describe('createUsersCart', () => {
        it('should return FAILED_TO_CREATE_CART when data is null and error is null', async () => {
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
    });

    describe('getCartData', () => {
        it('should return error for invalid UUID format', async () => {
            const result = await getCartData('invalid-id');

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.INVALID_USER_SESSION,
            });
        });

        it('should throw error when authenticated user does not match target user ID', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const result = await getCartData(validUUID);

            expect(recordSecurityAuditLog).toHaveBeenCalled();
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });
        });

        it('should return default empty cart when repo error is APP_ERROR_MESSAGES.NO_DATA_RETURNED', async () => {
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
            expect(Repo.fetchFullCartWithBooks).toHaveBeenCalledWith(expect.any(Object), validUUID);
            expect(mapDatabaseCartToDomain).toHaveBeenCalledWith(mockCartData);
        });

        it('should handle database error', async () => {
            const dbError = 'Fetch failed';
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

        it('should execute catch block when exception is thrown during getCartData', async () => {
            const exceptionError = new Error('Critical failure in getCartData');
            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockRejectedValue(exceptionError);

            const result = await getCartData(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Critical failure in getCartData',
            });
        });
    });

    describe('ensureCartExists', () => {
        it('should return cart ID if it already exists', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: { id: validCartID },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const result = await ensureCartExists(validUUID);

            expect(result).toEqual({ data: validCartID, error: null });
        });

        it('should create cart if it does not exist', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: { id: validCartID },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await ensureCartExists(validUUID);

            expect(result).toEqual({ data: validCartID, error: null });
        });

        it('should reach the fallback branch when createUsersCart returns null data without an error', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: { id: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await ensureCartExists(validUUID);

            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.FAILED_TO_CREATE_CART}`,
            });
        });

        it('should return sanitized error when cart creation returns an error object', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockResolvedValue({
                data: null,
                error: { message: 'db error' },
            } as unknown as Awaited<ReturnType<typeof Repo.createCart>>);

            const result = await ensureCartExists(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith({ message: 'db error' });
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: db error',
            });
        });

        it('should execute catch block when exception is thrown during ensureCartExists (findCartIdByUserId)', async () => {
            const exceptionError = new Error('Critical failure in findCartIdByUserId');
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockRejectedValue(exceptionError);

            const result = await ensureCartExists(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Critical failure in findCartIdByUserId',
            });
        });

        it('should execute catch block when exception is thrown during ensureCartExists (createCart)', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const exceptionError = new Error(
                'Critical failure in createCart during ensureCartExists',
            );
            (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockRejectedValue(
                exceptionError,
            );

            const result = await ensureCartExists(validUUID);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Critical failure in createCart during ensureCartExists',
            });
        });

        it('should propagate a thrown sanitizer error from ensureCartExists catch block', async () => {
            (
                Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
            ).mockResolvedValue({
                data: null,
                error: { message: 'Lookup failed' },
            } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

            const sanitizerError = new Error('Sanitizer exploded');
            (
                sanitizeSupabaseError as jest.MockedFunction<typeof sanitizeSupabaseError>
            ).mockImplementation(() => {
                throw sanitizerError;
            });

            await expect(ensureCartExists(validUUID)).rejects.toThrow('Sanitizer exploded');
        });
    });

    describe('executeCartOperation and getCartOperation', () => {
        it('should return unsupported action type error for invalid operation type', async () => {
            const result = await executeCartOperation('INVALID_TYPE', validCartID, validBookID, 1);

            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.any(Object),
            );
            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE,
            });
        });

        it('should execute INSERT operation successfully', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(result).toEqual({
                data: true,
                error: null,
                message:
                    CART_SUCCESS_MESSAGES[
                        CART_OPERATION_TYPES.INSERT as keyof typeof CART_SUCCESS_MESSAGES
                    ],
            });
        });

        it('should execute UPDATE operation successfully', async () => {
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.UPDATE,
                validCartID,
                validBookID,
                2,
            );

            expect(result).toEqual({
                data: true,
                error: null,
                message:
                    CART_SUCCESS_MESSAGES[
                        CART_OPERATION_TYPES.UPDATE as keyof typeof CART_SUCCESS_MESSAGES
                    ],
            });
        });

        it('should fall back to CART_SUCCESS_MESSAGES.DEFAULT when specific success message is missing', async () => {
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.REMOVE,
                validCartID,
                validBookID,
                1,
            );

            expect(result).toEqual({
                data: true,
                error: null,
                message: 'Default success message',
            });
        });

        it('should return error when operation returns an error', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: null,
                error: 'Insert failed',
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(sanitizeSupabaseError).toHaveBeenCalledWith('Insert failed');
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Insert failed',
            });
        });

        it('should return error when operation returns null data without error', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(
                APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE,
            );
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE}`,
            });
        });

        it('should execute catch block and record security audit when exception is thrown during executeCartOperation', async () => {
            const exceptionError = new Error('Unexpected execution failure');
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockRejectedValue(
                exceptionError,
            );

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
            expect(recordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                null,
                expect.any(Object),
            );
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Unexpected execution failure',
            });
        });
    });

    describe('item mutation wrapper functions (addItemToUsersCart, updateItemInUsersCart, removeItemFromUsersCart)', () => {
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
                    data: false,
                    error: 'Add failed',
                } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

                const result = await addItemToUsersCart(validCartID, validBookID, 2);

                expect(result).toEqual({
                    data: false,
                    error: 'Add failed',
                });
            });
        });

        describe('updateItemInUsersCart', () => {
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
                    data: false,
                    error: 'Update failed',
                } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

                const result = await updateItemInUsersCart(validCartID, validBookID, 3);

                expect(result).toEqual({
                    data: false,
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
                    data: false,
                    error: 'Remove failed',
                } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

                const result = await removeItemFromUsersCart(validCartID, validBookID);

                expect(result).toEqual({
                    data: false,
                    error: 'Remove failed',
                });
            });
        });
    });
});
