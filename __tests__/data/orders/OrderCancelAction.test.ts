import { cancelOrderAction } from '@/data/orders/OrderCancelAction';
import { createBackendClient } from '@/utils/db/server';
import { verifyRateLimit } from '@/utils/network/rateLimiter';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { cancelOrderRpc } from '@/data/orders/OrderCancelRepository';
import { revalidatePath } from 'next/cache';

jest.mock('@/utils/db/server');
jest.mock('@/utils/network/rateLimiter');
jest.mock('@/utils/network/getAppClientIp');
jest.mock('@/data/orders/OrderCancelRepository');
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('cancelOrderAction', () => {
    const mockGetAppClientIp = jest.mocked(getAppClientIp);
    const mockVerifyRateLimit = jest.mocked(verifyRateLimit);
    const mockCreateBackendClient = jest.mocked(createBackendClient);
    const mockCancelOrderRpc = jest.mocked(cancelOrderRpc);

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    const mockSupabase = {
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null,
            }),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAppClientIp.mockResolvedValue('127.0.0.1');
        mockVerifyRateLimit.mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 1000,
        });
        mockCreateBackendClient.mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
    });

    it('returns error when orderId is invalid UUID', async () => {
        const result = await cancelOrderAction('invalid-uuid');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid order reference format.');
    });

    it('returns error when IP rate limit is exceeded', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            error: 'Rate limited IP',
            limit: 10,
            remaining: 0,
            reset: Date.now() + 1000,
        });
        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Rate limited IP');
    });

    it('returns default error when IP rate limit fails without explicit error message', async () => {
        mockVerifyRateLimit.mockResolvedValueOnce({
            success: false,
            error: undefined,
            limit: 10,
            remaining: 0,
            reset: Date.now() + 1000,
        });
        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Too many requests. Please try again later.');
    });

    it('returns error when user is unauthenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Not auth' },
        } as unknown as ReturnType<typeof mockSupabase.auth.getUser>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Login required to proceed to checkout.');
    });

    it('returns error when user rate limit is exceeded', async () => {
        mockVerifyRateLimit
            .mockResolvedValueOnce({
                success: true,
                limit: 10,
                remaining: 9,
                reset: Date.now() + 1000,
            })
            .mockResolvedValueOnce({
                success: false,
                error: 'Rate limited user',
                limit: 10,
                remaining: 0,
                reset: Date.now() + 1000,
            });

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Rate limited user');
    });

    it('returns default error when user rate limit fails without explicit error message', async () => {
        mockVerifyRateLimit
            .mockResolvedValueOnce({
                success: true,
                limit: 10,
                remaining: 9,
                reset: Date.now() + 1000,
            })
            .mockResolvedValueOnce({
                success: false,
                error: undefined,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 1000,
            });

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Too many requests. Please try again later.');
    });

    it('returns error when cancelOrderRpc returns a database or network error', async () => {
        mockCancelOrderRpc.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database connection failure' },
        } as unknown as Awaited<ReturnType<typeof cancelOrderRpc>>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(typeof result.error).toBe('string');
    });

    it('returns error when RPC returns CANNOT_CANCEL_ORDER error code', async () => {
        mockCancelOrderRpc.mockResolvedValueOnce({
            data: { success: false, error: 'CANNOT_CANCEL_ORDER' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof cancelOrderRpc>>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Only pending orders can be cancelled.');
    });

    it('returns error when RPC returns ORDER_NOT_FOUND error code', async () => {
        mockCancelOrderRpc.mockResolvedValueOnce({
            data: { success: false, error: 'ORDER_NOT_FOUND' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof cancelOrderRpc>>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Order details could not be found.');
    });

    it('returns default failure error when RPC returns an unknown error code', async () => {
        mockCancelOrderRpc.mockResolvedValueOnce({
            data: { success: false, error: 'UNKNOWN_CUSTOM_ERROR' },
            error: null,
        } as unknown as Awaited<ReturnType<typeof cancelOrderRpc>>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to cancel the order.');
    });

    it('successfully cancels order and revalidates paths', async () => {
        mockCancelOrderRpc.mockResolvedValueOnce({
            data: { success: true },
            error: null,
        } as unknown as Awaited<ReturnType<typeof cancelOrderRpc>>);

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(true);
        expect(revalidatePath).toHaveBeenCalledWith(`/user/order/${validUuid}`);
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
    });

    it('handles unexpected thrown exceptions gracefully in catch block', async () => {
        mockGetAppClientIp.mockRejectedValueOnce(new Error('Unexpected system crash'));

        const result = await cancelOrderAction(validUuid);
        expect(result.success).toBe(false);
        expect(typeof result.error).toBe('string');
    });
});
