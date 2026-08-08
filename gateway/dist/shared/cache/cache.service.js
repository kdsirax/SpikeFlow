import { redisClient } from "./redis.js";
import { logger } from "../logger/logger.js";
/** Cache TTL for MVP — 5 minutes */
export const CACHE_TTL_SECONDS = 300;
/**
 * Canonical cache key factories.
 * Use these everywhere — never construct keys manually.
 */
export const CacheKeys = {
    operation: (operationName) => `operation:${operationName}`,
    graphqlService: (id) => `graphql-service:${id}`,
    routingPolicy: (operationId) => `routing-policy:${operationId}`,
};
export class CacheService {
    /**
     * Read a value from cache.
     * Returns null on a miss (key absent or expired).
     */
    async get(key) {
        const value = await redisClient.get(key);
        if (!value)
            return null;
        logger.debug({ key }, "Cache hit");
        return JSON.parse(value);
    }
    /**
     * Write a value to cache with a TTL (seconds).
     */
    async set(key, value, ttl = CACHE_TTL_SECONDS) {
        await redisClient.set(key, JSON.stringify(value), { EX: ttl });
        logger.debug({ key, ttl }, "Cache set");
    }
    /**
     * Invalidate a single key.
     * Call after any write to the underlying Postgres record.
     */
    async delete(key) {
        await redisClient.del(key);
        logger.debug({ key }, "Cache invalidated");
    }
}
export const cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map