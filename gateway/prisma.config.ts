import dotenv from "dotenv";
if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});
