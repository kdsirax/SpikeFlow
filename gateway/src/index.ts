import { startServer } from "./app.js";
import { logger } from "./shared/logger/logger.js";

startServer().catch((err) => {
  logger.error(err, "Failed to start Apollo Server");
});