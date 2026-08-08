import { redisClient } from "./redis.js";
import { logger } from "../logger/logger.js";

/** Cache TTL for MVP — 5 minutes */
export const CACHE_TTL_SECONDS = 300;

/**
 * Canonical cache key factories.
 * Use these everywhere — never construct keys manually.
 */
export const CacheKeys = {
  operation: (operationName: string) => `operation:${operationName}`,
  graphqlService: (id: string) => `graphql-service:${id}`,
  routingPolicy: (operationId: string) => `routing-policy:${operationId}`,
} as const;

export class CacheService {
  /**
   * Read a value from cache.
   * Returns null on a miss (key absent or expired).
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    if (!value) return null;

    logger.debug({ key }, "Cache hit");
    return JSON.parse(value) as T;
  }

  /**
   * Write a value to cache with a TTL (seconds).
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL_SECONDS): Promise<void> {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    logger.debug({ key, ttl }, "Cache set");
  }

  /**
   * Invalidate a single key.
   * Call after any write to the underlying Postgres record.
   */
  async delete(key: string): Promise<void> {
    await redisClient.del(key);
    logger.debug({ key }, "Cache invalidated");
  }
}

export const cacheService = new CacheService();