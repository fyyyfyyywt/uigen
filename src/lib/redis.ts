import Redis from 'ioredis';

const getRedisClient = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // In Docker, the host is 'redis'. In local dev without Docker, it might be localhost if running locally
    // If not running Redis at all, we catch the error below.

    try {
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 3) return null; // stop retrying
                return Math.min(times * 50, 2000);
            }
        });

        client.on('error', (err) => {
            // Suppress connection errors to avoid flooding logs if Redis is missing
            // console.warn('Redis connection error:', err.message);
        });

        return client;
    } catch (error) {
        console.error('Failed to create Redis client:', error);
        return null;
    }
};

// Singleton instance
export const redis = getRedisClient();
