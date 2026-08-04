import { getUsersCartID } from '@/data/cart/CartService';
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

describe('CartService getUsersCartID', () => {
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
        const result = await getUsersCartID('invalid-id');

        expect(result).toEqual({ data: null, error: APP_ERROR_MESSAGES.INVALID_USER_SESSION });
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

    it('should return null when the repository returns an empty cart payload', async () => {
        (
            Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
        ).mockResolvedValue({
            data: {} as { id: string },
            error: null,
        } as unknown as Awaited<ReturnType<typeof Repo.findCartIdByUserId>>);

        const result = await getUsersCartID(validUUID);

        expect(result).toEqual({ data: null, error: null });
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

    it('should handle database error object returned from repo', async () => {
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

    it('should execute catch block when exception is thrown during getUsersCartID', async () => {
        const exceptionError = new Error('Critical failure in getUsersCartID');
        (
            Repo.findCartIdByUserId as jest.MockedFunction<typeof Repo.findCartIdByUserId>
        ).mockRejectedValue(exceptionError);

        const result = await getUsersCartID(validUUID);

        expect(sanitizeSupabaseError).toHaveBeenCalledWith(exceptionError);
        expect(result).toEqual({
            data: null,
            error: 'Sanitized: Critical failure in getUsersCartID',
        });
    });
});
