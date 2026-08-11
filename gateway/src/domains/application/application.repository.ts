import type { CreateApplicationInput, UpdateApplicationInput, Application } from "./application.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { Application as PrismaApplication } from "../../generated/prisma/client.js";

export interface IApplicationRepository {
  create(data: CreateApplicationInput): Promise<Application>;
  update(id: string, data: UpdateApplicationInput): Promise<Application>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Application[]>;
  findById(id: string): Promise<Application | null>;
  findByName(name: string): Promise<Application | null>;
  findByOrganizationId(organizationId: string): Promise<Application[]>;
}

export class PrismaApplicationRepository implements IApplicationRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaApplication): Application {
    return {
      id: item.id,
      organizationId: item.organizationId,
      name: item.name,
      description: item.description ?? "",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async create(data: CreateApplicationInput): Promise<Application> {
    try {
      const created = await this.db.application.create({
        data,
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: UpdateApplicationInput): Promise<Application> {
    try {
      const updated = await this.db.application.update({
        where: { id },
        data: {
          ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.application.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<Application[]> {
    const list = await this.db.application.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<Application | null> {
    const item = await this.db.application.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByName(name: string): Promise<Application | null> {
    const item = await this.db.application.findFirst({
      where: { name },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Application[]> {
    const list = await this.db.application.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }
}
