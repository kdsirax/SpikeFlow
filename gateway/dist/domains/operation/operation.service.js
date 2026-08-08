import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";
export class OperationService {
    repository;
    graphqlServiceRepository;
    cache;
    constructor(repository, graphqlServiceRepository, cache) {
        this.repository = repository;
        this.graphqlServiceRepository = graphqlServiceRepository;
        this.cache = cache;
    }
    async createOperation(input) {
        const service = await this.graphqlServiceRepository.findById(input.graphQLServiceId);
        if (!service) {
            throw new NotFoundError("GraphQL Service not found");
        }
        const created = await this.repository.create(input);
        logger.info({ operationId: created.id, name: created.name }, "Operation created");
        return created;
    }
    async getOperations() {
        return this.repository.findAll();
    }
    async getOperationById(id) {
        return this.repository.findById(id);
    }
    /**
     * Update an operation and invalidate its cache entry.
     * Pattern: Update DB → Delete cache → next request reloads from Postgres.
     */
    async invalidateCacheByName(operationName) {
        await this.cache.delete(CacheKeys.operation(operationName));
        logger.info({ operationName }, "Operation cache invalidated");
    }
}
//# sourceMappingURL=operation.service.js.map