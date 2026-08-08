import { prisma } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
export class PrismaOperationRepository {
    db;
    constructor(db = prisma) {
        this.db = db;
    }
    mapToDomain(item) {
        return {
            id: item.id,
            graphQLServiceId: item.graphQLServiceId,
            name: item.name,
            type: item.type,
            estimatedCost: item.estimatedCost,
            cacheable: item.cacheable,
            requiresDatabase: item.requiresDatabase,
            priority: item.priority,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    async create(data) {
        try {
            const created = await this.db.operation.create({
                data,
            });
            return this.mapToDomain(created);
        }
        catch (error) {
            handlePrismaError(error);
        }
    }
    async findAll() {
        const list = await this.db.operation.findMany();
        return list.map((item) => this.mapToDomain(item));
    }
    async findById(id) {
        const item = await this.db.operation.findUnique({
            where: { id },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByName(name) {
        const item = await this.db.operation.findFirst({
            where: { name },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByGraphQLServiceId(graphQLServiceId) {
        const list = await this.db.operation.findMany({
            where: { graphQLServiceId },
        });
        return list.map((item) => this.mapToDomain(item));
    }
}
//# sourceMappingURL=operation.repository.js.map