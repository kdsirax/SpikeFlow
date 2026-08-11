import type { IRoutingPolicyRepository } from "./routing-policy.repository.js";
import type { IOperationRepository } from "../operation/operation.repository.js";
import type {
  CreateRoutingPolicyInput,
  UpdateRoutingPolicyInput,
  RoutingPolicy,
} from "./routing-policy.types.js";
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

  async updateRoutingPolicy(
    id: string,
    input: UpdateRoutingPolicyInput
  ): Promise<RoutingPolicy> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Routing policy not found");
    }

    if (input.operationId) {
      const operation = await this.operationRepository.findById(input.operationId);
      if (!operation) {
        throw new NotFoundError("Operation not found");
      }
    }

    const updated = await this.repository.update(id, input);
    await this.invalidateCacheByOperationId(existing.operationId);
    if (updated.operationId !== existing.operationId) {
      await this.invalidateCacheByOperationId(updated.operationId);
    }
    logger.info({ policyId: updated.id, operationId: updated.operationId }, "Routing policy updated");
    return updated;
  }

  async deleteRoutingPolicy(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Routing policy not found");
    }

    const deleted = await this.repository.delete(id);
    await this.invalidateCacheByOperationId(existing.operationId);
    logger.info({ policyId: id, operationId: existing.operationId }, "Routing policy deleted");
    return deleted;
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
