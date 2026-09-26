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
import { stripe } from '@/data/checkout/CheckoutStripeServer';

jest.mock('@/utils/db/server');
jest.mock('@/utils/db/safeSupabaseQuery');
jest.mock('@/utils/network/retry');
jest.mock('@/utils/errors/SupabaseErrorHandler');
jest.mock('@/data/checkout/repositories/CheckoutUserRepository');
jest.mock('@/data/checkout/CheckoutUtils', () => ({
    stripe: {
        customers: {
            create: jest.fn(),
        },
    },
}));

describe('CheckoutUserService', () => {
    let mockSupabase: jest.Mocked<SupabaseClient<Database>>;
    const mockUpdate = jest.fn();
    const mockEq = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockEq.mockResolvedValue({ data: null, error: null });
        mockUpdate.mockReturnValue({ eq: mockEq });

        mockSupabase = {
            from: jest.fn().mockReturnValue({
                update: mockUpdate,
            }),
        } as unknown as jest.Mocked<SupabaseClient<Database>>;

        jest.mocked(createBackendClient).mockResolvedValue(mockSupabase);
        jest.mocked(safeSupabaseQuery).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(withRetry).mockImplementation(async (fn) => (await fn()) as never);
        jest.mocked(sanitizeSupabaseError).mockImplementation((err) =>
            typeof err === 'string' ? err : 'Sanitized error',
        );
    });

    describe('getCurrentUserCheckoutData', () => {
        it('should return user data with existing stripeCustomerId when present in profile', async () => {
            const mockUser = { id: 'user-uuid-123', email: 'user@example.com' };
            const mockProfile = {
                id: 'user-uuid-123',
                first_name: 'Jane',
                last_name: 'Doe',
                street_address: '123 High St',
                stripe_customer_id: 'cus_existing123',
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
                stripeCustomerId: 'cus_existing123',
            });
            expect(stripe.customers.create).not.toHaveBeenCalled();
        });

        it('should create a new Stripe customer if profile has no stripe_customer_id and user has email', async () => {
            const mockUser = { id: 'user-uuid-123', email: 'user@example.com' };
            const mockProfile = {
                id: 'user-uuid-123',
                first_name: 'Jane',
                last_name: 'Doe',
            };

            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as never);

            jest.mocked(fetchUserProfileById).mockResolvedValue({
                data: mockProfile,
                error: null,
            } as never);

            jest.mocked(stripe.customers.create).mockResolvedValue({
                id: 'cus_new123',
            } as never);

            const result = await getCurrentUserCheckoutData();

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                id: 'user-uuid-123',
                email: 'user@example.com',
                profile: mockProfile,
                stripeCustomerId: 'cus_new123',
            });
            expect(stripe.customers.create).toHaveBeenCalledWith({
                email: 'user@example.com',
                metadata: { supabaseUserId: 'user-uuid-123' },
            });
            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockUpdate).toHaveBeenCalledWith({ stripe_customer_id: 'cus_new123' });
            expect(mockEq).toHaveBeenCalledWith('id', 'user-uuid-123');
        });

        it('should handle Stripe customer creation error gracefully and return null stripeCustomerId', async () => {
            const mockUser = { id: 'user-uuid-123', email: 'user@example.com' };
            const mockProfile = {
                id: 'user-uuid-123',
                first_name: 'Jane',
            };

            jest.mocked(fetchUserAuthData).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            } as never);

            jest.mocked(fetchUserProfileById).mockResolvedValue({
                data: mockProfile,
                error: null,
            } as never);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.mocked(stripe.customers.create).mockRejectedValue(new Error('Stripe API error'));

            const result = await getCurrentUserCheckoutData();

            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                id: 'user-uuid-123',
                email: 'user@example.com',
                profile: mockProfile,
                stripeCustomerId: null,
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create Stripe customer',
                expect.any(Error),
            );
            consoleSpy.mockRestore();
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
            expect(result.data?.stripeCustomerId).toBeNull();
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
