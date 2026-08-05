import { getCartData, ensureCartExists, executeCartOperation } from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { mapDatabaseCartToDomain, CartItem } from '@/data/cart/CartMapper';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { CART_OPERATION_TYPES, CART_SUCCESS_MESSAGES } from '@/data/cart/CartConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';

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
jest.mock('@/data/cart/CartConstants', () => {
    const actual = jest.requireActual<typeof import('@/data/cart/CartConstants')>(
        '@/data/cart/CartConstants',
    );
    return {
        ...actual,
        CART_SUCCESS_MESSAGES: {
            ...actual.CART_SUCCESS_MESSAGES,
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
        (sanitizeSupabaseError as unknown as jest.Mock).mockImplementation(
            defaultSanitizeImplementation,
        );
        (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
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
            expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
            expect(result).toEqual({
                data: null,
                error: `Sanitized: ${APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS}`,
            });
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

        it('should execute catch block when exception is thrown during getCartData', async () => {
            const exceptionError = new Error('Critical failure in getCartData');
            (
                Repo.fetchFullCartWithBooks as jest.MockedFunction<
                    typeof Repo.fetchFullCartWithBooks
                >
            ).mockRejectedValue(exceptionError);

            const result = await getCartData(validUUID);

            expect(recordSecurityAuditLog).toHaveBeenCalled();
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
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
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
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
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
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
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
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
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
            (sanitizeSupabaseError as unknown as jest.Mock).mockImplementation(() => {
                throw sanitizerError;
            });

            await expect(ensureCartExists(validUUID)).rejects.toThrow('Sanitizer exploded');
        });
    });

    describe('executeCartOperation', () => {
        it('should return unsupported action type error for unknown operation', async () => {
            const result = await executeCartOperation('INVALID_TYPE', validCartID, validBookID, 1);

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.UNSUPPORTED_ACTION_TYPE,
            });
        });

        it('should execute INSERT operation successfully and return success message', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                2,
            );

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe(CART_SUCCESS_MESSAGES[CART_OPERATION_TYPES.INSERT]);
        });

        it('should execute UPDATE operation successfully and return success message', async () => {
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.UPDATE,
                validCartID,
                validBookID,
                3,
            );

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe(CART_SUCCESS_MESSAGES[CART_OPERATION_TYPES.UPDATE]);
        });

        it('should execute REMOVE operation successfully and return success message', async () => {
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.REMOVE,
                validCartID,
                validBookID,
                0,
            );

            expect(result.data).toBe(true);
            expect(result.error).toBeNull();
            expect(result.message).toBe(CART_SUCCESS_MESSAGES[CART_OPERATION_TYPES.REMOVE]);
        });

        it('should handle operation error in executeCartOperation', async () => {
            const opError = { message: 'Operation failed' };
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: false,
                error: opError,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(opError);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized: Operation failed');
        });

        it('should return the default success message when the operation message is empty', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const originalInsertMessage = CART_SUCCESS_MESSAGES[CART_OPERATION_TYPES.INSERT];
            (CART_SUCCESS_MESSAGES as Record<string, string>)[CART_OPERATION_TYPES.INSERT] = '';

            try {
                const result = await executeCartOperation(
                    CART_OPERATION_TYPES.INSERT,
                    validCartID,
                    validBookID,
                    1,
                );

                expect(result.message).toBe(CART_SUCCESS_MESSAGES.DEFAULT);
                expect(result.data).toBe(true);
                expect(result.error).toBeNull();
            } finally {
                (CART_SUCCESS_MESSAGES as Record<string, string>)[CART_OPERATION_TYPES.INSERT] =
                    originalInsertMessage;
            }
        });

        it('should propagate a thrown sanitizer error from executeCartOperation catch block', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: false,
                error: { message: 'Operation failed' },
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const sanitizerError = new Error('Sanitizer exploded');
            (sanitizeSupabaseError as unknown as jest.Mock).mockImplementation(() => {
                throw sanitizerError;
            });

            await expect(
                executeCartOperation(CART_OPERATION_TYPES.INSERT, validCartID, validBookID, 1),
            ).rejects.toThrow('Sanitizer exploded');
        });
    });
});
