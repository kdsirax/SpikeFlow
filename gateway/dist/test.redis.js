import { connectRedis, redisClient } from "./shared/cache/redis.js";
async function main() {
    try {
        await connectRedis();
        console.log("✅ Connected to Redis");
        // SET
        await redisClient.set("name", "Khushal");
        console.log("SET successful");
        // GET
        const value = await redisClient.get("name");
        console.log("GET:", value);
        // DELETE
        await redisClient.del("name");
        console.log("DELETE successful");
        // Verify deletion
        const deleted = await redisClient.get("name");
        console.log("After DELETE:", deleted);
        await redisClient.quit();
    }
    catch (err) {
        console.error(err);
    }
}
main();
//# sourceMappingURL=test.redis.js.map