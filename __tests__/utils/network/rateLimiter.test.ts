import { createHash } from 'node:crypto';
import {
    buildRateLimitIdentifiers,
    limiters,
    verifyRateLimit,
} from '@/utils/network/rateLimiter';

describe('rateLimiter', () => {
    const success = {
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456,
    };

    it('checks every identifier using a stable hash instead of storing raw identifiers', async () => {
        const limiter = { limit: jest.fn().mockResolvedValue(success) };

        const result = await verifyRateLimit({
            identifiers: ['ip:203.0.113.1', 'email:reader@example.com'],
            limiter,
        });

        expect(limiter.limit).toHaveBeenNthCalledWith(
            1,
            createHash('sha256').update('ip:203.0.113.1').digest('hex'),
        );
        expect(limiter.limit).toHaveBeenNthCalledWith(
            2,
            createHash('sha256').update('email:reader@example.com').digest('hex'),
        );
        expect(result).toEqual(success);
    });

    it('rejects the request when any identifier is over its limit', async () => {
        const limiter = {
            limit: jest
                .fn()
                .mockResolvedValueOnce(success)
                .mockResolvedValueOnce({ ...success, success: false, remaining: 0 }),
        };

        const result = await verifyRateLimit({
            identifiers: ['ip:203.0.113.1', 'user:account-1'],
            limiter,
        });

        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('fails closed by default when the shared store is unavailable', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const limiter = { limit: jest.fn().mockRejectedValue(new Error('Redis unavailable')) };

        const result = await verifyRateLimit({
            identifier: 'email:reader@example.com',
            limiter,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Security verification unavailable. Please try again later.');
        expect(errorSpy).toHaveBeenCalledWith(
            '[Rate Limiter Error]',
            expect.objectContaining({ identifierCount: 1, failClosed: true }),
        );
        expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('reader@example.com');
        errorSpy.mockRestore();
    });

    it('allows explicitly configured fail-open behavior for non-sensitive traffic', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const limiter = { limit: jest.fn().mockRejectedValue(new Error('Redis unavailable')) };

        const result = await verifyRateLimit({
            identifier: 'ip:203.0.113.1',
            limiter,
            failClosed: false,
        });

        expect(result.success).toBe(true);
        expect(result.limit).toBe(0);
        errorSpy.mockRestore();
    });

    it('fails closed when Upstash credentials are not configured', async () => {
        const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
        const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const result = await verifyRateLimit({
                identifier: 'ip:203.0.113.1',
                limiter: limiters.auth,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'Security verification unavailable. Please try again later.',
            );
        } finally {
            if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
            else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
            if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
            else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
            errorSpy.mockRestore();
        }
    });

    it('builds combined account and address identifiers', () => {
        expect(buildRateLimitIdentifiers('203.0.113.1', 'account-1')).toEqual([
            'user:account-1',
            'ip:203.0.113.1',
        ]);
        expect(buildRateLimitIdentifiers('203.0.113.1')).toEqual(['ip:203.0.113.1']);
    });
});
