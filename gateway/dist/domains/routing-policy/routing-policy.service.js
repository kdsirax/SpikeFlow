import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
export class RoutingPolicyService {
    repository;
    operationRepository;
    cache;
    constructor(repository, operationRepository, cache) {
        this.repository = repository;
        this.operationRepository = operationRepository;
        this.cache = cache;
    }
    async createRoutingPolicy(input) {
        const operation = await this.operationRepository.findById(input.operationId);
        if (!operation) {
            throw new NotFoundError("Operation not found");
        }
        const created = await this.repository.create(input);
        logger.info({ policyId: created.id, operationId: created.operationId }, "Routing policy created");
        return created;
    }
    async getRoutingPolicies() {
        return this.repository.findAll();
    }
    async getRoutingPolicyById(id) {
        return this.repository.findById(id);
    }
    /**
     * Invalidate the cache entry for a routing policy by its operationId.
     * Pattern: Update DB → Delete cache → next request reloads from Postgres.
     */
    async invalidateCacheByOperationId(operationId) {
        await this.cache.delete(CacheKeys.routingPolicy(operationId));
        logger.info({ operationId }, "Routing policy cache invalidated");
    }
}
//# sourceMappingURL=routing-policy.service.js.map