import type { IRoutingPolicyRepository } from "./routing-policy.repository.js";
import type { IOperationRepository } from "../operation/operation.repository.js";
import type { CreateRoutingPolicyInput, RoutingPolicy } from "./routing-policy.types.js";
import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export class RoutingPolicyService {
  constructor(
    private readonly repository: IRoutingPolicyRepository,
    private readonly operationRepository: IOperationRepository,
    private readonly cache: CacheService
  ) {}

  async createRoutingPolicy(input: CreateRoutingPolicyInput): Promise<RoutingPolicy> {
    const operation = await this.operationRepository.findById(input.operationId);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }

    const created = await this.repository.create(input);
    logger.info({ policyId: created.id, operationId: created.operationId }, "Routing policy created");
    return created;
  }

  async getRoutingPolicies(): Promise<RoutingPolicy[]> {
    return this.repository.findAll();
  }

  async getRoutingPolicyById(id: string): Promise<RoutingPolicy | null> {
    return this.repository.findById(id);
  }

  /**
   * Invalidate the cache entry for a routing policy by its operationId.
   * Pattern: Update DB → Delete cache → next request reloads from Postgres.
   */
  async invalidateCacheByOperationId(operationId: string): Promise<void> {
    await this.cache.delete(CacheKeys.routingPolicy(operationId));
    logger.info({ operationId }, "Routing policy cache invalidated");
  }
}
