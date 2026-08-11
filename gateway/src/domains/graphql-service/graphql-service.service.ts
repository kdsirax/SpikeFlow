import type { IGraphQLServiceRepository } from "./graphql-service.repository.js";
import type { IApplicationRepository } from "../application/application.repository.js";
import type {
  CreateGraphQLServiceInput,
  UpdateGraphQLServiceInput,
  GraphQLService,
} from "./graphql-service.types.js";
import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class GraphQLServiceService {
  constructor(
    private readonly repository: IGraphQLServiceRepository,
    private readonly applicationRepository: IApplicationRepository,
    private readonly cache: CacheService
  ) {}

  async createGraphQLService(input: CreateGraphQLServiceInput): Promise<GraphQLService> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new NotFoundError("Application not found");
    }

    const created = await this.repository.create(input);
    logger.info({ serviceId: created.id, name: created.name }, "GraphQL service created");
    return created;
  }

  async updateGraphQLService(
    id: string,
    input: UpdateGraphQLServiceInput
  ): Promise<GraphQLService> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("GraphQL Service not found");
    }

    if (input.applicationId) {
      const application = await this.applicationRepository.findById(input.applicationId);
      if (!application) {
        throw new NotFoundError("Application not found");
      }
    }

    const updated = await this.repository.update(id, input);
    await this.invalidateCacheById(id);
    logger.info({ serviceId: updated.id, name: updated.name }, "GraphQL service updated");
    return updated;
  }

  async deleteGraphQLService(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("GraphQL Service not found");
    }

    const deleted = await this.repository.delete(id);
    await this.invalidateCacheById(id);
    logger.info({ serviceId: id }, "GraphQL service deleted");
    return deleted;
  }

  async getGraphQLServices(): Promise<GraphQLService[]> {
    return this.repository.findAll();
  }

  async getGraphQLServiceById(id: string): Promise<GraphQLService | null> {
    return this.repository.findById(id);
  }

  /**
   * Invalidate the cache entry for a specific GraphQL service.
   * Pattern: Update DB → Delete cache → next request reloads from Postgres.
   */
  async invalidateCacheById(id: string): Promise<void> {
    await this.cache.delete(CacheKeys.graphqlService(id));
    logger.info({ serviceId: id }, "GraphQL service cache invalidated");
  }
}
