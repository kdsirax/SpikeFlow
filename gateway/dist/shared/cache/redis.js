import { createClient } from "redis";
import { logger } from "../logger/logger.js";
export const redisClient = createClient({
    ...(process.env.REDIS_URL !== undefined && { url: process.env.REDIS_URL }),
});
// Register event listeners once at module level (before any connect call)
redisClient.on("connect", () => {
    logger.info("🔴 Redis connected");
});
redisClient.on("error", (err) => {
    logger.error({ err }, "Redis error");
});
redisClient.on("reconnecting", () => {
    logger.warn("Redis reconnecting...");
});
/**
 * Call once at bootstrap. Idempotent — safe to call even if already open.
 */
export async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}
//# sourceMappingURL=redis.js.map