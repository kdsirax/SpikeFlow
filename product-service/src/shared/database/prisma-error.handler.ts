import { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { AppError } from "../errors/AppError.js";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        throw new NotFoundError(
          (error.meta?.["cause"] as string) || "Requested record was not found"
        );
      case "P2002": {
        const target = (error.meta?.["target"] as string[])?.join(", ");
        throw new ValidationError(
          `Unique constraint violation${target ? ` on field(s): ${target}` : ""}`
        );
      }
      default:
        throw new AppError(`Database error [${error.code}]: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError(`Prisma validation error: ${error.message}`);
  }

  if (error instanceof AppError) {
    throw error;
  }

  throw new AppError(
    error instanceof Error ? error.message : "Unknown database error"
  );
}
