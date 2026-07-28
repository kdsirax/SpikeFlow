import { PrismaClient, Prisma } from "../../generated/prisma/client.js";

export const prisma = new (PrismaClient as new (options?: any) => PrismaClient)();

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;