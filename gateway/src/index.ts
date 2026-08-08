import { connectRedis } from "./shared/cache/redis.js";
import { startServer } from "./app.js";
import { logger } from "./shared/logger/logger.js";

async function bootstrap() {
  // 1. Connect to Redis before starting any server
  await connectRedis();

  // 2. Start Express gateway (port 4001) + Apollo management API (port 4000)
  await startServer();
}

bootstrap().catch((err) => {
  logger.error(err, "Failed to bootstrap application");
  process.exit(1);
});