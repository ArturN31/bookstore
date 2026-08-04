import { createUsersCart } from '@/data/cart/CartService';
import * as Repo from '@/data/cart/CartRepository';
import { createBackendClient } from '@/utils/db/server';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';

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

describe('CartService createUsersCart', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const otherValidUUID = '660e8400-e29b-41d4-a716-446655440000';

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

    it('should execute catch block when exception is thrown during createUsersCart', async () => {
        const exceptionError = new Error('Critical failure in createUsersCart');
        (Repo.createCart as jest.MockedFunction<typeof Repo.createCart>).mockRejectedValue(
            exceptionError,
        );

        const result = await createUsersCart(validUUID);

        expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
        expect(result).toEqual({
            data: null,
            error: 'Sanitized: Critical failure in createUsersCart',
        });
    });
});
