import { getCartData } from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { mapDatabaseCartToDomain, CartItem } from '@/data/cart/CartMapper';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
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

describe('CartService Data Retrieval (getCartData)', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const otherValidUUID = '660e8400-e29b-41d4-a716-446655440000';

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
                error: APP_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
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

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error(dbError));
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
});
