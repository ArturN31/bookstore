import { executeCartOperation } from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { CART_OPERATION_TYPES, CART_SUCCESS_MESSAGES } from '@/data/cart/CartConstants';

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
            REMOVE: undefined,
            DEFAULT: 'Default success message',
        },
    };
});

type SanitizeFn = (err: unknown) => string;
type BackendClient = Awaited<ReturnType<typeof createBackendClient>>;

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

describe('CartService Operations (executeCartOperation)', () => {
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
            mockSupabase as unknown as BackendClient,
        );
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: validUUID } },
            error: null,
        } as unknown as Awaited<ReturnType<typeof mockSupabase.auth.getUser>>);
    });

    describe('executeCartOperation and getCartOperation', () => {
        it('should return unsupported action type error for invalid operation type', async () => {
            const result = await executeCartOperation('INVALID_TYPE', validCartID, validBookID, 1);

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

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Insert failed'));
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

        it('should hit the catch block when an unexpected error is thrown inside the try block', async () => {
            const unexpectedError = new Error('Unexpected execution failure');

            (Repo.upsertItem as jest.MockedFunction<typeof Repo.upsertItem>).mockResolvedValue({
                data: null,
                error: 'Trigger error path',
            } as unknown as Awaited<ReturnType<typeof Repo.upsertItem>>);

            (
                sanitizeSupabaseError as jest.MockedFunction<typeof sanitizeSupabaseError>
            ).mockImplementationOnce(() => {
                throw unexpectedError;
            });

            const result = await executeCartOperation(
                CART_OPERATION_TYPES.INSERT,
                validCartID,
                validBookID,
                1,
            );

            expect(sanitizeSupabaseError).toHaveBeenCalledTimes(2);
            expect(sanitizeSupabaseError).toHaveBeenNthCalledWith(
                1,
                new Error('Trigger error path'),
            );
            expect(sanitizeSupabaseError).toHaveBeenNthCalledWith(2, unexpectedError);

            expect(result).toEqual({
                data: null,
                error: 'Sanitized: Unexpected execution failure',
            });
        });
    });
});
