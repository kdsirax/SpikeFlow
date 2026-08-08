import type { IOperationRepository } from "./operation.repository.js";
import type { IGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import type { CreateOperationInput, Operation } from "./operation.types.js";
import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class OperationService {
  constructor(
    private readonly repository: IOperationRepository,
    private readonly graphqlServiceRepository: IGraphQLServiceRepository,
    private readonly cache: CacheService
  ) {}

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    const service = await this.graphqlServiceRepository.findById(input.graphQLServiceId);
    if (!service) {
      throw new NotFoundError("GraphQL Service not found");
    }

    const created = await this.repository.create(input);
    logger.info({ operationId: created.id, name: created.name }, "Operation created");
    return created;
  }

  async getOperations(): Promise<Operation[]> {
    return this.repository.findAll();
  }

  async getOperationById(id: string): Promise<Operation | null> {
    return this.repository.findById(id);
  }

  /**
   * Update an operation and invalidate its cache entry.
   * Pattern: Update DB → Delete cache → next request reloads from Postgres.
   */
  async invalidateCacheByName(operationName: string): Promise<void> {
    await Promise.all([
      this.cache.delete(CacheKeys.operation(operationName)),
      this.cache.delete(CacheKeys.resolvedRequest(operationName)),
    ]);
    logger.info({ operationName }, "Operation cache invalidated");
  }
}
