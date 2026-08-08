import { Runtime } from "./routing-policy.types.js";
import { prisma } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
export class PrismaRoutingPolicyRepository {
    db;
    constructor(db = prisma) {
        this.db = db;
    }
    mapToDomain(item) {
        return {
            id: item.id,
            operationId: item.operationId,
            preferredRuntime: item.preferredRuntime,
            cpuThreshold: item.cpuThreshold,
            requestThreshold: item.requestThreshold,
            enabled: item.enabled,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    async create(data) {
        try {
            const created = await this.db.routingPolicy.create({
                data,
            });
            return this.mapToDomain(created);
        }
        catch (error) {
            handlePrismaError(error);
        }
    }
    async findAll() {
        const list = await this.db.routingPolicy.findMany();
        return list.map((item) => this.mapToDomain(item));
    }
    async findById(id) {
        const item = await this.db.routingPolicy.findUnique({
            where: { id },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByOperationId(operationId) {
        const item = await this.db.routingPolicy.findUnique({
            where: { operationId },
        });
        return item ? this.mapToDomain(item) : null;
    }
}
//# sourceMappingURL=routing-policy.repository.js.map