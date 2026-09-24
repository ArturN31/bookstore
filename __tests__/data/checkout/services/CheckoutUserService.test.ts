import { getCurrentUserCheckoutData } from '@/data/checkout/services/CheckoutUserService';
import {
    fetchUserAuthData,
    fetchUserProfileById,
} from '@/data/checkout/repositories/CheckoutUserRepository';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { withRetry } from '@/utils/network/retry';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutUserRepository');

describe('CheckoutUserService', () => {
    const mockSupabase = {} as SupabaseClient<Database>;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(withRetry).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized error',
        );
    });

    describe('getCurrentUserCheckoutData', () => {
        it('should return user ID, email, and profile data when user is authenticated', async () => {
            const mockUser = { id: 'user-uuid-123', email: 'user@example.com' };
            const mockProfile = {
                id: 'user-uuid-123',
                first_name: 'Jane',
                last_name: 'Doe',
                street_address: '123 High St',
            };

            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as never);

            jest.mocked(fetchUserProfileById).mockResolvedValue({
                data: mockProfile,
                error: null,
            } as never);

            const result = await getCurrentUserCheckoutData();

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                id: 'user-uuid-123',
                email: 'user@example.com',
                profile: mockProfile,
            });
            expect(fetchUserProfileById).toHaveBeenCalledWith(mockSupabase, 'user-uuid-123');
        });

        it('should fallback email to empty string if authenticated user email is undefined', async () => {
            const mockUser = { id: 'user-uuid-123', email: undefined };

            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as never);

            jest.mocked(fetchUserProfileById).mockResolvedValue({
                data: null,
                error: null,
            } as never);

            const result = await getCurrentUserCheckoutData();

            expect(result.error).toBeNull();
            expect(result.data?.email).toBe('');
        });

        it('should return CHECKOUT_LOGIN_REQUIRED when auth returns no user object', async () => {
            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: null },
                error: null,
            } as never);

            const result = await getCurrentUserCheckoutData();

            expect(result.data).toBeNull();
            expect(result.error).toBe(APP_ERROR_MESSAGES.CHECKOUT_LOGIN_REQUIRED);
        });

        it('should return sanitized error when fetchUserAuthData returns an auth error', async () => {
            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: null },
                error: { message: 'JWT expired' },
            } as never);

            const result = await getCurrentUserCheckoutData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
            expect(sanitizeSupabaseError).toHaveBeenCalledTimes(1);
        });

        it('should handle thrown exception and return sanitized error', async () => {
            jest.mocked(createBackendClient).mockRejectedValueOnce(
                new Error('Supabase client error'),
            );

            const result = await getCurrentUserCheckoutData();

            expect(result.data).toBeNull();
            expect(result.error).toBe('Sanitized error');
        });
    });
});
