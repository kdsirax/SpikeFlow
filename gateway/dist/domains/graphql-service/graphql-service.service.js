import { CacheKeys, CacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";
export class GraphQLServiceService {
    repository;
    applicationRepository;
    cache;
    constructor(repository, applicationRepository, cache) {
        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.cache = cache;
    }
    async createGraphQLService(input) {
        const application = await this.applicationRepository.findById(input.applicationId);
        if (!application) {
            throw new NotFoundError("Application not found");
        }
        const created = await this.repository.create(input);
        logger.info({ serviceId: created.id, name: created.name }, "GraphQL service created");
        return created;
    }
    async getGraphQLServices() {
        return this.repository.findAll();
    }
    async getGraphQLServiceById(id) {
        return this.repository.findById(id);
    }
    /**
     * Invalidate the cache entry for a specific GraphQL service.
     * Pattern: Update DB → Delete cache → next request reloads from Postgres.
     */
    async invalidateCacheById(id) {
        await this.cache.delete(CacheKeys.graphqlService(id));
        logger.info({ serviceId: id }, "GraphQL service cache invalidated");
    }
}
//# sourceMappingURL=graphql-service.service.js.map