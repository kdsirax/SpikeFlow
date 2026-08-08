import type { IOperationRepository } from "../operation/operation.repository.js";
import type { IRoutingPolicyRepository } from "../routing-policy/routing-policy.repository.js";
import type { IGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import type { Operation } from "../operation/operation.types.js";
import type { RoutingPolicy } from "../routing-policy/routing-policy.types.js";
import type { GraphQLService } from "../graphql-service/graphql-service.types.js";
import { CacheKeys, CacheService, CACHE_TTL_SECONDS } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export interface ResolvedRequest {
  operation: Operation;
  routingPolicy: RoutingPolicy;
  graphqlService: GraphQLService;
  cacheHit: boolean;
}

export class RequestResolverService {
  constructor(
    private readonly operationRepository: IOperationRepository,
    private readonly routingPolicyRepository: IRoutingPolicyRepository,
    private readonly graphqlServiceRepository: IGraphQLServiceRepository,
    private readonly cache: CacheService
  ) {}

  /**
   * Resolves operation metadata, routing policy, and target GraphQL service by operationName.
   * Checks Redis cache first; on cache miss, queries Postgres repositories and populates Redis.
   */
  async resolve(operationName: string): Promise<ResolvedRequest> {
    const cacheKey = CacheKeys.resolvedRequest(operationName);

    // 1. Try Redis cache first
    const cached = await this.cache.get<{
      operation: Operation;
      routingPolicy: RoutingPolicy;
      graphqlService: GraphQLService;
    }>(cacheKey);

    if (cached) {
      logger.debug({ operationName }, "Request resolution cache HIT");
      return {
        operation: cached.operation,
        routingPolicy: cached.routingPolicy,
        graphqlService: cached.graphqlService,
        cacheHit: true,
      };
    }

    logger.debug({ operationName }, "Request resolution cache MISS — querying repositories");

    // 2. Query Operation repository
    const operation = await this.operationRepository.findByName(operationName);
    if (!operation) {
      throw new NotFoundError(`Operation '${operationName}' is not registered.`);
    }

    // 3. Query Routing Policy repository
    const routingPolicy = await this.routingPolicyRepository.findByOperationId(operation.id);
    if (!routingPolicy) {
      throw new NotFoundError(`Routing policy not found for operation ID: ${operation.id}`);
    }

    // 4. Query GraphQL Service repository
    const graphqlService = await this.graphqlServiceRepository.findById(operation.graphQLServiceId);
    if (!graphqlService) {
      throw new NotFoundError("No GraphQL Service found.");
    }

    const resolved = {
      operation,
      routingPolicy,
      graphqlService,
    };

    // 5. Store in Redis cache
    await this.cache.set(cacheKey, resolved, CACHE_TTL_SECONDS);

    // Also populate individual keys for consistency with management API
    await this.cache.set(CacheKeys.operation(operationName), operation, CACHE_TTL_SECONDS);
    await this.cache.set(CacheKeys.routingPolicy(operation.id), routingPolicy, CACHE_TTL_SECONDS);
    await this.cache.set(CacheKeys.graphqlService(operation.graphQLServiceId), graphqlService, CACHE_TTL_SECONDS);

    return {
      ...resolved,
      cacheHit: false,
    };
  }
}
