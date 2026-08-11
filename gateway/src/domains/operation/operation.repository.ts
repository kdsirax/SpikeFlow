import type { CreateOperationInput, UpdateOperationInput, Operation } from "./operation.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { Operation as PrismaOperation } from "../../generated/prisma/client.js";

export interface IOperationRepository {
  create(data: CreateOperationInput): Promise<Operation>;
  update(id: string, data: UpdateOperationInput): Promise<Operation>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Operation[]>;
  findById(id: string): Promise<Operation | null>;
  findByName(name: string): Promise<Operation | null>;
  findByGraphQLServiceId(graphQLServiceId: string): Promise<Operation[]>;
}

export class PrismaOperationRepository implements IOperationRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaOperation): Operation {
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

  async create(data: CreateOperationInput): Promise<Operation> {
    try {
      const created = await this.db.operation.create({
        data,
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: UpdateOperationInput): Promise<Operation> {
    try {
      const updated = await this.db.operation.update({
        where: { id },
        data: {
          ...(data.graphQLServiceId !== undefined && { graphQLServiceId: data.graphQLServiceId }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
          ...(data.cacheable !== undefined && { cacheable: data.cacheable }),
          ...(data.requiresDatabase !== undefined && { requiresDatabase: data.requiresDatabase }),
          ...(data.priority !== undefined && { priority: data.priority }),
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.operation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<Operation[]> {
    const list = await this.db.operation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<Operation | null> {
    const item = await this.db.operation.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByName(name: string): Promise<Operation | null> {
    const item = await this.db.operation.findFirst({
      where: { name },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByGraphQLServiceId(graphQLServiceId: string): Promise<Operation[]> {
    const list = await this.db.operation.findMany({
      where: { graphQLServiceId },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }
}
