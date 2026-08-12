import {
    isValidUUID,
    verifyUserSession,
    handleItemMutation,
    executeCartAction,
    CART_OPERATIONS,
} from '@/data/cart/CartServiceUtils';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { withRetry } from '@/utils/network/retry';
import { SafeQueryResult, safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { revalidateTag } from 'next/cache';

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/cart/CartRepository');
jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(
        async <T>(
            fn: () => Promise<{ data: T | null; error: unknown }>,
        ): Promise<SafeQueryResult<T>> => {
            const res = await fn();
            if (res.error) {
                return { data: null, error: String(res.error) } as unknown as SafeQueryResult<T>;
            }
            return { data: res.data ?? null, error: null } as unknown as SafeQueryResult<T>;
        },
    ),
}));

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

describe('CartServiceUtils', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const otherValidUUID = '660e8400-e29b-41d4-a716-446655440000';
    const invalidUUID = 'not-a-uuid';
    const validCartID = '123e4567-e89b-12d3-a456-426614174000';
    const validBookID = '987e6543-e21b-12d3-a456-426614174000';

    type BackendClient = Awaited<ReturnType<typeof createBackendClient>>;

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
            mockSupabase as unknown as BackendClient,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
    });

    describe('isValidUUID', () => {
        it('should return true for valid UUID', () => {
            expect(isValidUUID(validUUID)).toBe(true);
        });

        it('should return false for invalid UUID', () => {
            expect(isValidUUID(invalidUUID)).toBe(false);
        });
    });

    describe('verifyUserSession', () => {
        it('should return user ID when session is valid', async () => {
            const userId = await verifyUserSession(mockSupabase as unknown as BackendClient);
            expect(userId).toBe(validUUID);
        });

        it('should return null when session has error', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: new Error('Session error'),
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const userId = await verifyUserSession(mockSupabase as unknown as BackendClient);
            expect(userId).toBeNull();
        });

        it('should return null when user is missing', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const userId = await verifyUserSession(mockSupabase as unknown as BackendClient);
            expect(userId).toBeNull();
        });
    });

    describe('handleItemMutation', () => {
        it('should return malformed identifier error if cartID or bookID is invalid', async () => {
            const actionFn = jest.fn();
            const result = await handleItemMutation('INSERT', invalidUUID, validBookID, actionFn);

            expect(result).toEqual({
                data: false,
                error: APP_ERROR_MESSAGES.MALFORMED_IDENTIFIER,
            });
            expect(actionFn).not.toHaveBeenCalled();
        });

        it('should return error if executeCartAction fails', async () => {
            const actionFn = jest.fn().mockResolvedValue({ data: null, error: 'DB Error' });

            const result = await handleItemMutation('INSERT', validCartID, validBookID, actionFn);

            expect(result.data).toBe(false);
            expect(result.error).toBe('Sanitized: DB Error');
        });

        it('should execute successfully, revalidate tag, and return action result', async () => {
            const actionFn = jest.fn().mockResolvedValue({ data: true, error: null });

            const result = await handleItemMutation('INSERT', validCartID, validBookID, actionFn);

            expect(result).toEqual({ data: true, error: null });
            expect(revalidateTag).toHaveBeenCalledWith(`cart_${validCartID}`, 'max');
        });
    });

    describe('executeCartAction', () => {
        it('should return error if targetUserId is invalid UUID', async () => {
            const actionFn = jest.fn();
            const result = await executeCartAction('TEST', invalidUUID, actionFn);

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.INVALID_USER_SESSION,
            });
            expect(recordSecurityAuditLog).toHaveBeenCalled();
            expect(actionFn).not.toHaveBeenCalled();
        });

        it('should return unauthorized error when requireUserMatch is true and user IDs mismatch', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: otherValidUUID } },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const actionFn = jest.fn();
            const result = await executeCartAction('TEST', validUUID, actionFn, true);

            expect(recordSecurityAuditLog).toHaveBeenCalled();
            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
            });
            expect(actionFn).not.toHaveBeenCalled();
        });

        it('should return unauthenticated error when requireUserMatch is false and no user session', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);

            const actionFn = jest.fn();
            const result = await executeCartAction('TEST', null, actionFn, false);

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.UNAUTHENTICATED_USER,
            });
            expect(actionFn).not.toHaveBeenCalled();
        });

        it('should return NO_DATA_RETURNED error directly from safeSupabaseQuery', async () => {
            const actionFn = jest.fn();
            (
                safeSupabaseQuery as jest.MockedFunction<typeof safeSupabaseQuery>
            ).mockResolvedValueOnce({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            } as unknown as SafeQueryResult<unknown>);

            const result = await executeCartAction('TEST', validUUID, actionFn);

            expect(result).toEqual({
                data: null,
                error: APP_ERROR_MESSAGES.NO_DATA_RETURNED,
            });
        });

        it('should sanitize and return database error from safeSupabaseQuery', async () => {
            const actionFn = jest.fn();
            const dbError = 'Database failure';
            (
                safeSupabaseQuery as jest.MockedFunction<typeof safeSupabaseQuery>
            ).mockResolvedValueOnce({
                data: null,
                error: dbError,
            } as unknown as SafeQueryResult<unknown>);

            const result = await executeCartAction('TEST', validUUID, actionFn);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error(dbError));
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Database failure',
            });
        });

        it('should return data successfully on successful execution', async () => {
            const actionFn = jest.fn();
            (
                safeSupabaseQuery as jest.MockedFunction<typeof safeSupabaseQuery>
            ).mockResolvedValueOnce({
                data: 'success-data',
                error: null,
            } as unknown as SafeQueryResult<string>);

            const result = await executeCartAction('TEST', validUUID, actionFn);

            expect(result).toEqual({
                data: 'success-data',
                error: null,
            });
        });

        it('should handle exceptions thrown within withRetry / execution block', async () => {
            const actionFn = jest.fn();
            const exception = new Error('Unexpected crash');
            (withRetry as jest.MockedFunction<typeof withRetry>).mockRejectedValueOnce(exception);

            const result = await executeCartAction('TEST', validUUID, actionFn);

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(exception);
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Unexpected crash',
            });
        });
    });

    describe('CART_OPERATIONS', () => {
        it('should execute add operation successfully', async () => {
            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            const operationFn = CART_OPERATIONS.add(validCartID, validBookID, 1);
            const result = await operationFn(mockSupabase as unknown as BackendClient);

            expect(result).toEqual({ data: true, error: null });
            expect(Repo.upsertItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 1);
        });

        it('should execute update operation successfully', async () => {
            (Repo.updateItem as jest.MockedFunction<typeof Repo.updateItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.updateItem>>);

            const operationFn = CART_OPERATIONS.update(validCartID, validBookID, 2);
            const result = await operationFn(mockSupabase as unknown as BackendClient);

            expect(result).toEqual({ data: true, error: null });
            expect(Repo.updateItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID, 2);
        });

        it('should execute remove operation successfully', async () => {
            (Repo.deleteItem as jest.MockedFunction<typeof Repo.deleteItem>).mockResolvedValue({
                data: true,
                error: null,
            } as unknown as Awaited<ReturnType<typeof Repo.deleteItem>>);

            const operationFn = CART_OPERATIONS.remove(validCartID, validBookID, 0);
            const result = await operationFn(mockSupabase as unknown as BackendClient);

            expect(result).toEqual({ data: true, error: null });
            expect(Repo.deleteItem).toHaveBeenCalledWith(mockSupabase, validCartID, validBookID);
        });
    });
});
