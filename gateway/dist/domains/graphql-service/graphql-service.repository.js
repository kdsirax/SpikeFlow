import { prisma } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
export class PrismaGraphQLServiceRepository {
    db;
    constructor(db = prisma) {
        this.db = db;
    }
    mapToDomain(item) {
        return {
            id: item.id,
            applicationId: item.applicationId,
            name: item.name,
            endpoint: item.endpoint,
            environment: item.environment,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    async create(data) {
        try {
            const created = await this.db.graphQLService.create({
                data,
            });
            return this.mapToDomain(created);
        }
        catch (error) {
            handlePrismaError(error);
        }
    }
    async findAll() {
        const list = await this.db.graphQLService.findMany();
        return list.map((item) => this.mapToDomain(item));
    }
    async findById(id) {
        const item = await this.db.graphQLService.findUnique({
            where: { id },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByName(name) {
        const item = await this.db.graphQLService.findFirst({
            where: { name },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByEndpoint(endpoint) {
        const item = await this.db.graphQLService.findFirst({
            where: { endpoint },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByApplicationId(applicationId) {
        const list = await this.db.graphQLService.findMany({
            where: { applicationId },
        });
        return list.map((item) => this.mapToDomain(item));
    }
}
//# sourceMappingURL=graphql-service.repository.js.map