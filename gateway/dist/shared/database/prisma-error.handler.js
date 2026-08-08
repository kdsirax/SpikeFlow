import { ValidationError } from "../errors/ValidationError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Prisma } from "../../generated/prisma/client.js";
export function handlePrismaError(error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const meta = error.meta;
            const target = Array.isArray(meta?.target) ? meta.target.join(", ") : "field";
            throw new ValidationError(`Unique constraint violation on ${target}`);
        }
        if (error.code === "P2025") {
            throw new NotFoundError("Requested record not found");
        }
    }
    throw error;
}
//# sourceMappingURL=prisma-error.handler.js.map