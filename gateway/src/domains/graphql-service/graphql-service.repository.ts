import type {
  CreateGraphQLServiceInput,
  UpdateGraphQLServiceInput,
  GraphQLService,
} from "./graphql-service.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { GraphQLService as PrismaGraphQLService } from "../../generated/prisma/client.js";

export interface IGraphQLServiceRepository {
  create(data: CreateGraphQLServiceInput): Promise<GraphQLService>;
  update(id: string, data: UpdateGraphQLServiceInput): Promise<GraphQLService>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<GraphQLService[]>;
  findById(id: string): Promise<GraphQLService | null>;
  findByName(name: string): Promise<GraphQLService | null>;
  findByApplicationId(applicationId: string): Promise<GraphQLService[]>;
}

export class PrismaGraphQLServiceRepository implements IGraphQLServiceRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaGraphQLService): GraphQLService {
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

  async create(data: CreateGraphQLServiceInput): Promise<GraphQLService> {
    try {
      const created = await this.db.graphQLService.create({
        data,
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: UpdateGraphQLServiceInput): Promise<GraphQLService> {
    try {
      const updated = await this.db.graphQLService.update({
        where: { id },
        data: {
          ...(data.applicationId !== undefined && { applicationId: data.applicationId }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.endpoint !== undefined && { endpoint: data.endpoint }),
          ...(data.environment !== undefined && { environment: data.environment }),
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.graphQLService.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<GraphQLService[]> {
    const list = await this.db.graphQLService.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<GraphQLService | null> {
    const item = await this.db.graphQLService.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByName(name: string): Promise<GraphQLService | null> {
    const item = await this.db.graphQLService.findFirst({
      where: { name },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByApplicationId(applicationId: string): Promise<GraphQLService[]> {
    const list = await this.db.graphQLService.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }
}
