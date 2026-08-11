import type { CreateExecutionHistoryInput, ExecutionHistory } from "./execution-history.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { ExecutionHistory as PrismaExecutionHistory } from "../../generated/prisma/client.js";

export interface IExecutionHistoryRepository {
  create(data: CreateExecutionHistoryInput): Promise<ExecutionHistory>;
  findAll(): Promise<ExecutionHistory[]>;
  findById(id: string): Promise<ExecutionHistory | null>;
  findByOperationId(operationId: string): Promise<ExecutionHistory[]>;
}

export class PrismaExecutionHistoryRepository implements IExecutionHistoryRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaExecutionHistory): ExecutionHistory {
    return {
      id: item.id,
      operationId: item.operationId,
      runtimeChosen: item.runtimeChosen,
      decisionReason: item.decisionReason,
      cpuUsage: item.cpuUsage,
      memoryUsage: item.memoryUsage,
      cacheHit: item.cacheHit,
      responseTime: item.responseTime,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    };
  }

  async create(data: CreateExecutionHistoryInput): Promise<ExecutionHistory> {
    try {
      const created = await this.db.executionHistory.create({
        data: {
          operationId: data.operationId,
          runtimeChosen: data.runtimeChosen,
          decisionReason: data.decisionReason ?? null,
          cpuUsage: data.cpuUsage ?? null,
          memoryUsage: data.memoryUsage ?? null,
          cacheHit: data.cacheHit,
          responseTime: data.responseTime,
          status: data.status,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<ExecutionHistory[]> {
    const list = await this.db.executionHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<ExecutionHistory | null> {
    const item = await this.db.executionHistory.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByOperationId(operationId: string): Promise<ExecutionHistory[]> {
    const list = await this.db.executionHistory.findMany({
      where: { operationId },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }
}
