import { prisma } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
export class PrismaApplicationRepository {
    db;
    constructor(db = prisma) {
        this.db = db;
    }
    mapToDomain(item) {
        return {
            id: item.id,
            organizationId: item.organizationId,
            name: item.name,
            description: item.description ?? "",
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    async create(data) {
        try {
            const created = await this.db.application.create({
                data,
            });
            return this.mapToDomain(created);
        }
        catch (error) {
            handlePrismaError(error);
        }
    }
    async findAll() {
        const list = await this.db.application.findMany();
        return list.map((item) => this.mapToDomain(item));
    }
    async findById(id) {
        const item = await this.db.application.findUnique({
            where: { id },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByName(name) {
        const item = await this.db.application.findFirst({
            where: { name },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByOrganizationId(organizationId) {
        const list = await this.db.application.findMany({
            where: { organizationId },
        });
        return list.map((item) => this.mapToDomain(item));
    }
}
//# sourceMappingURL=application.repository.js.map