import { getUsersCartID, createUsersCart, ensureCartExists } from '@/data/cart/CartService';
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
    recordSecurityAuditLog: jest.fn(),
}));
jest.mock('@/utils/network/retry', () => ({
    withRetry: jest.fn(<T>(fn: () => Promise<T>) => fn()),
}));
jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(<T>(fn: () => Promise<T>) => fn()),
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

describe('CartService Initialization (getUsersCartID, createUsersCart, ensureCartExists)', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const validCartID = '123e4567-e89b-12d3-a456-426614174000';

    type BackendClient = Awaited<ReturnType<typeof createBackendClient>>;

    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Suppress expected security audit warnings outside request context during tests
        jest.spyOn(console, 'warn').mockImplementation(
            (message: unknown, ...optionalParams: unknown[]) => {
                if (typeof message === 'string' && message.includes('[SecurityAudit]')) {
                    return;
                }
                console.warn(message, ...optionalParams);
            },
        );

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

    afterEach(() => {
        jest.restoreAllMocks();
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

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(
                new Error(JSON.stringify({ message: 'db error' })),
            );
            expect(result).toEqual({
                data: null,
                error: 'Sanitized: {"message":"db error"}',
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
});
