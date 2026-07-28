import type { CreateRoutingPolicyInput, RoutingPolicy } from "./routing-policy.types.js";
import { Runtime } from "./routing-policy.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { RoutingPolicy as PrismaRoutingPolicy } from "../../generated/prisma/client.js";

export interface IRoutingPolicyRepository {
  create(data: CreateRoutingPolicyInput): Promise<RoutingPolicy>;
  findAll(): Promise<RoutingPolicy[]>;
  findById(id: string): Promise<RoutingPolicy | null>;
  findByOperationId(operationId: string): Promise<RoutingPolicy | null>;
}

export class PrismaRoutingPolicyRepository implements IRoutingPolicyRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaRoutingPolicy): RoutingPolicy {
    return {
      id: item.id,
      operationId: item.operationId,
      preferredRuntime: item.preferredRuntime as Runtime,
      cpuThreshold: item.cpuThreshold,
      requestThreshold: item.requestThreshold,
      enabled: item.enabled,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async create(data: CreateRoutingPolicyInput): Promise<RoutingPolicy> {
    try {
      const created = await this.db.routingPolicy.create({
        data,
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<RoutingPolicy[]> {
    const list = await this.db.routingPolicy.findMany();
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<RoutingPolicy | null> {
    const item = await this.db.routingPolicy.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByOperationId(operationId: string): Promise<RoutingPolicy | null> {
    const item = await this.db.routingPolicy.findUnique({
      where: { operationId },
    });
    return item ? this.mapToDomain(item) : null;
  }
}
