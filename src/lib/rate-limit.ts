import { redis } from './redis';
import { headers } from 'next/headers';

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

const DAILY_GLOBAL_LIMIT = 100; // Cap at ~100 requests/day to protect budget (~$2 on Pro tier)

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
    if (!redis || redis.status !== 'ready') {
        // Fail open if Redis is not configured or down
        return { success: true, limit: 10, remaining: 10, reset: 0 };
    }

    const windowMs = 60 * 1000; // 1 minute
    const limit = 3; // 10 requests per minute per IP

    const now = Date.now();
    const windowStart = now - windowMs;

    const key = `rate_limit:${identifier}`;

    try {
        const multi = redis.multi();
        // Remove requests older than the window
        multi.zremrangebyscore(key, 0, windowStart);
        // Add current request
        multi.zadd(key, now, now.toString());
        // Count requests in window
        multi.zcard(key);
        // Set expiry for the key
        multi.expire(key, 60); // Expire after 1 minute

        const results = await multi.exec();

        if (!results) {
            throw new Error("Redis transaction failed");
        }

        const count = results[2][1] as number;

        return {
            success: count <= limit,
            limit,
            remaining: Math.max(0, limit - count),
            reset: now + windowMs
        };
    } catch (error) {
        console.error('Rate limiting error:', error);
        return { success: true, limit: 10, remaining: 10, reset: 0 };
    }
}

export async function checkDailyGlobalLimit(): Promise<{ success: boolean; remaining: number }> {
    if (!redis || redis.status !== 'ready') return { success: true, remaining: 100 };

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `daily_global:${today}`;

    try {
        // Increment and get new value
        const count = await redis.incr(key);

        // If it's the first request of the day, set expiry to 24h + buffer
        if (count === 1) {
            await redis.expire(key, 86400 + 3600);
        }

        const remaining = Math.max(0, DAILY_GLOBAL_LIMIT - count);

        return {
            success: count <= DAILY_GLOBAL_LIMIT,
            remaining
        };
    } catch (error) {
        console.error('Daily limit check error:', error);
        return { success: true, remaining: 100 };
    }
}

export async function checkRateLimit() {
    // 1. Check Global Daily Limit first (Cost Protection)
    const dailyCheck = await checkDailyGlobalLimit();
    if (!dailyCheck.success) {
        return {
            success: false,
            limit: DAILY_GLOBAL_LIMIT,
            remaining: 0,
            reset: Date.now() + 3600000 // Retry in an hour
        };
    }

    // 2. Check Per-IP Limit (Abuse Protection)
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'anonymous';

    return rateLimit(ip);
}
