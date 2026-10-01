import { createBackendClient } from '@/utils/db/server';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { SupabaseClient, AuthError } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { getOrderDetailsById } from '@/data/checkout/services/CheckoutService';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import { verifyOrderOwnershipAndFetch } from '@/data/checkout/services/OrderOwnershipService';

jest.mock('@/utils/db/server');
jest.mock('@/utils/security/securityAuditLogger');
jest.mock('@/data/checkout/services/CheckoutService');

describe('verifyOrderOwnershipAndFetch', () => {
    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    } as unknown as SupabaseClient<Database>;

    const mockCreateBackendClient = jest.mocked(createBackendClient);
    const mockRecordSecurityAuditLog = jest.mocked(recordSecurityAuditLog);
    const mockGetOrderDetailsById = jest.mocked(getOrderDetailsById);

    const mockOrder: OrderWithRelations = {
        id: 'order-123',
        user_id: 'user-auth-123',
        status: 'PROCESSING',
        created_at: '2026-01-01T00:00:00Z',
        payment_method: 'card',
        total_amount: 20.0,
        order_items: [],
        order_discounts: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateBackendClient.mockResolvedValue(mockSupabase);
    });

    it('should return NOT_FOUND when orderId is empty or not a string', async () => {
        const resultEmpty = await verifyOrderOwnershipAndFetch('');
        expect(resultEmpty).toEqual({ status: 'NOT_FOUND', order: null });

        const resultInvalid = await verifyOrderOwnershipAndFetch(null as unknown as string);
        expect(resultInvalid).toEqual({ status: 'NOT_FOUND', order: null });
    });

    it('should return UNAUTHENTICATED when user session cannot be retrieved', async () => {
        jest.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
            data: { user: null },
            error: {
                message: 'Auth error',
                status: 401,
                code: '401',
                __isAuthError: true,
                name: 'AuthError',
                toJSON: () => ({}),
            } as unknown as AuthError,
        });

        const result = await verifyOrderOwnershipAndFetch('order-123');

        expect(result).toEqual({ status: 'UNAUTHENTICATED', order: null });
        expect(mockGetOrderDetailsById).not.toHaveBeenCalled();
    });

    it('should return NOT_FOUND when order fetch fails persistently across retries', async () => {
        jest.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
            data: { user: { id: 'user-auth-123' } as never },
            error: null,
        });

        mockGetOrderDetailsById.mockResolvedValue({
            data: null,
            error: 'Failed to fetch',
        });

        const promise = verifyOrderOwnershipAndFetch('order-123');

        const result = await promise;

        expect(result).toEqual({ status: 'NOT_FOUND', order: null });
        expect(mockGetOrderDetailsById).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should succeed on retry if initial order fetches fail temporarily', async () => {
        jest.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
            data: { user: { id: 'user-auth-123' } as never },
            error: null,
        });

        mockGetOrderDetailsById
            .mockResolvedValueOnce({ data: null, error: 'Temporary error' })
            .mockResolvedValueOnce({ data: mockOrder, error: null });

        const result = await verifyOrderOwnershipAndFetch('order-123');

        expect(result).toEqual({ status: 'SUCCESS', order: mockOrder });
        expect(mockGetOrderDetailsById).toHaveBeenCalledTimes(2);
    });

    it('should return UNAUTHORIZED and log audit event when order belongs to another user', async () => {
        jest.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
            data: { user: { id: 'user-unauthorized-999' } as never },
            error: null,
        });

        mockGetOrderDetailsById.mockResolvedValueOnce({
            data: mockOrder,
            error: null,
        });

        const result = await verifyOrderOwnershipAndFetch('order-123');

        expect(result).toEqual({ status: 'UNAUTHORIZED', order: null });
        expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'user-unauthorized-999',
            {
                resource: 'ORDER_CONFIRMATION',
                orderId: 'order-123',
                resourceOwnerUserId: 'user-auth-123',
                attemptedUserId: 'user-unauthorized-999',
            },
        );
    });

    it('should return SUCCESS when user owns the order', async () => {
        jest.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
            data: { user: { id: 'user-auth-123' } as never },
            error: null,
        });

        mockGetOrderDetailsById.mockResolvedValueOnce({
            data: mockOrder,
            error: null,
        });

        const result = await verifyOrderOwnershipAndFetch('order-123');

        expect(result).toEqual({ status: 'SUCCESS', order: mockOrder });
        expect(mockRecordSecurityAuditLog).not.toHaveBeenCalled();
    });
});
