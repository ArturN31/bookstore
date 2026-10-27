import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const rateLimitPolicies = {
    // Authentication: 5 requests per 15 minutes
    auth: { requests: 5, window: '15 m', prefix: 'ratelimit:auth' },
    // Administrative / privileged actions: 3 requests per hour
    privileged: { requests: 10, window: '1 h', prefix: 'ratelimit:privileged' },
    // Checkout processing: 10 requests per minute
    checkout: { requests: 10, window: '1 m', prefix: 'ratelimit:checkout' },
    // Discount-code validation: 5 requests per minute
    discount: { requests: 5, window: '1 m', prefix: 'ratelimit:discount' },
    // User mutations: 20 requests per minute
    userMutation: { requests: 20, window: '1 m', prefix: 'ratelimit:mutation' },
    // Catalog and public-content reads: 60 requests per minute
    search: { requests: 60, window: '1 m', prefix: 'ratelimit:search' },
} as const;

type RateLimitPolicy = keyof typeof rateLimitPolicies;
type RateLimiter = Pick<Ratelimit, 'limit'>;

let configuredLimiters: Record<RateLimitPolicy, Ratelimit> | undefined;

function getConfiguredLimiters(): Record<RateLimitPolicy, Ratelimit> {
    if (configuredLimiters) return configuredLimiters;

    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token)
        throw new Error(
            'Upstash Redis rate limiting is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
        );

    const redis = new Redis({ url, token });
    configuredLimiters = Object.fromEntries(
        Object.entries(rateLimitPolicies).map(([name, policy]) => [
            name,
            new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(policy.requests, policy.window),
                analytics: true,
                prefix: policy.prefix,
            }),
        ]),
    ) as Record<RateLimitPolicy, Ratelimit>;

    return configuredLimiters;
}

function createLazyLimiter(policy: RateLimitPolicy): RateLimiter {
    return {
        limit: (identifier) => getConfiguredLimiters()[policy].limit(identifier),
    };
}

export const limiters: Record<RateLimitPolicy, RateLimiter> = {
    auth: createLazyLimiter('auth'),
    privileged: createLazyLimiter('privileged'),
    checkout: createLazyLimiter('checkout'),
    discount: createLazyLimiter('discount'),
    userMutation: createLazyLimiter('userMutation'),
    search: createLazyLimiter('search'),
};

export interface RateLimitCheckResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    error?: string;
}

type VerifyRateLimitOptions = {
    limiter: RateLimiter;
    failClosed?: boolean;
} & (
    | { identifier: string; identifiers?: never }
    | { identifiers: readonly [string, ...string[]]; identifier?: never }
);

export async function verifyRateLimit({
    identifier,
    identifiers,
    limiter,
    failClosed = true,
}: VerifyRateLimitOptions): Promise<RateLimitCheckResult> {
    const keys = identifiers ?? [identifier];

    try {
        if (keys.some((key) => !key.trim()))
            throw new Error('Rate limit identifiers must not be empty.');

        const results = await Promise.all(
            keys.map((key) => {
                const hashedKey = createHash('sha256').update(key).digest('hex');
                return limiter.limit(hashedKey);
            }),
        );

        return {
            success: results.every((result) => result.success),
            limit: Math.min(...results.map((result) => result.limit)),
            remaining: Math.min(...results.map((result) => result.remaining)),
            reset: Math.max(...results.map((result) => result.reset)),
        };
    } catch (error: unknown) {
        console.error('[Rate Limiter Error]', {
            identifierCount: keys.length,
            failClosed,
            error,
        });

        if (failClosed) {
            return {
                success: false,
                limit: 0,
                remaining: 0,
                reset: Date.now() + 60000,
                error: 'Security verification unavailable. Please try again later.',
            };
        }

        return {
            success: true,
            limit: 0,
            remaining: 1,
            reset: Date.now(),
        };
    }
}

export function buildRateLimitIdentifiers(
    ip: string,
    userId?: string | null,
): [string, ...string[]] {
    const identifiers: [string, ...string[]] = [`ip:${ip}`];
    if (userId) identifiers.unshift(`user:${userId}`);
    return identifiers;
}
