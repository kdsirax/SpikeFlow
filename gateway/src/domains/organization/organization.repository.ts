import type { CreateOrganizationInput, Organization } from "./organization.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { Organization as PrismaOrganization } from "../../generated/prisma/client.js";

export interface IOrganizationRepository {
  create(data: CreateOrganizationInput): Promise<Organization>;
  findAll(): Promise<Organization[]>;
  findById(id: string): Promise<Organization | null>;
  findByName(name: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
}

export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaOrganization): Organization {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async create(data: CreateOrganizationInput): Promise<Organization> {
    try {
      const created = await this.db.organization.create({
        data,
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<Organization[]> {
    const list = await this.db.organization.findMany();
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<Organization | null> {
    const item = await this.db.organization.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByName(name: string): Promise<Organization | null> {
    const item = await this.db.organization.findFirst({
      where: { name },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const item = await this.db.organization.findUnique({
      where: { slug },
    });
    return item ? this.mapToDomain(item) : null;
  }
}
