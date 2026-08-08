import { prisma } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
export class PrismaOrganizationRepository {
    db;
    constructor(db = prisma) {
        this.db = db;
    }
    mapToDomain(item) {
        return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        };
    }
    async create(data) {
        try {
            const created = await this.db.organization.create({
                data,
            });
            return this.mapToDomain(created);
        }
        catch (error) {
            handlePrismaError(error);
        }
    }
    async findAll() {
        const list = await this.db.organization.findMany();
        return list.map((item) => this.mapToDomain(item));
    }
    async findById(id) {
        const item = await this.db.organization.findUnique({
            where: { id },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findByName(name) {
        const item = await this.db.organization.findFirst({
            where: { name },
        });
        return item ? this.mapToDomain(item) : null;
    }
    async findBySlug(slug) {
        const item = await this.db.organization.findUnique({
            where: { slug },
        });
        return item ? this.mapToDomain(item) : null;
    }
}
//# sourceMappingURL=organization.repository.js.map