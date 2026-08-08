import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../generated/prisma/client.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:khushal3526@localhost:5432/spikeflow?schema=public";

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({ adapter });

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;
