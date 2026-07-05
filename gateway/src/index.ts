import { startServer } from "./app.js";

startServer().catch((err) => {
  console.error("Failed to start Apollo Server:", err);
});