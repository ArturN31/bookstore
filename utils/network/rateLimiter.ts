interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetMs: number;
}

/**
 * In-memory sliding window rate limiter utility.
 * Can be reused across Server Actions, API Routes, and Middleware.
 *
 * @param key - Unique identifier for the bucket (e.g. `login:ip_address` or `discount:user_id`)
 * @param limit - Max allowed requests within the given time window (default: 5)
 * @param windowMs - Time window length in milliseconds (default: 60000 / 1 min)
 */
export const checkRateLimit = (key: string, limit = 5, windowMs = 60000): RateLimitResult => {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        const newRecord: RateLimitRecord = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, newRecord);
        return {
            success: true,
            remaining: limit - 1,
            resetMs: windowMs,
        };
    }

    if (record.count >= limit)
        return {
            success: false,
            remaining: 0,
            resetMs: Math.max(0, record.resetTime - now),
        };

    record.count += 1;
    rateLimitStore.set(key, record);

    return {
        success: true,
        remaining: limit - record.count,
        resetMs: Math.max(0, record.resetTime - now),
    };
};
