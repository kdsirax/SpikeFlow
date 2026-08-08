import { parse, getOperationAST } from "graphql";
import type { IOperationRepository } from "../operation/operation.repository.js";
import type { IGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import type { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import type { GatewayForwardRequest, GatewayForwardResult } from "./gateway.types.js";
import type { Operation } from "../operation/operation.types.js";
import type { GraphQLService } from "../graphql-service/graphql-service.types.js";
import type { RoutingPolicy } from "../routing-policy/routing-policy.types.js";
import { CacheKeys, CacheService, CACHE_TTL_SECONDS } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class GatewayService {
  constructor(
    private readonly operationRepository: IOperationRepository,
    private readonly graphqlServiceRepository: IGraphQLServiceRepository,
    private readonly decisionEngineService: DecisionEngineService,
    private readonly cache: CacheService
  ) {}

  async forward(request: GatewayForwardRequest): Promise<GatewayForwardResult> {
    const { query, variables, operationName: clientOperationName } = request;

    // ── Step 1: Parse query AST → extract operation name ────────────────────
    let operationName: string;

    if (clientOperationName) {
      operationName = clientOperationName;
    } else {
      let document;
      try {
        document = parse(query);
      } catch (err) {
        throw new Error(`Invalid GraphQL query: ${(err as Error).message}`);
      }

      const operationAST = getOperationAST(document, null);
      if (!operationAST?.name?.value) {
        throw new Error(
          "Gateway requires a named GraphQL operation. " +
          "Use `query GetProducts { ... }` instead of `{ getProducts { ... } }`."
        );
      }
      operationName = operationAST.name.value;
    }

    logger.info({ operationName }, "Parsed operation name from query");

    // ── Step 2: Operation  →  Redis? → Postgres → store in Redis ─────────────
    const operationKey = CacheKeys.operation(operationName);
    let operation = await this.cache.get<Operation>(operationKey);

    if (!operation) {
      logger.debug({ operationName }, "Operation cache miss — querying Postgres");
      operation = await this.operationRepository.findByName(operationName);
      if (!operation) {
        throw new NotFoundError(`Operation "${operationName}" is not registered in the gateway`);
      }
      await this.cache.set(operationKey, operation, CACHE_TTL_SECONDS);
    }

    logger.info(
      { operationName, operationId: operation.id, graphQLServiceId: operation.graphQLServiceId },
      "Operation resolved"
    );

    // ── Step 3: Decision Engine  (routing policy lookup is inside, cached below)
    const decision = await this.decisionEngineService.makeRoutingDecision(operation.id);

    logger.info(
      { operationName, runtime: decision.runtime, reason: decision.reason },
      "Routing decision made"
    );

    // ── Step 4: GraphQLService  →  Redis? → Postgres → store in Redis ─────────
    const serviceKey = CacheKeys.graphqlService(operation.graphQLServiceId);
    let service = await this.cache.get<GraphQLService>(serviceKey);

    if (!service) {
      logger.debug({ graphQLServiceId: operation.graphQLServiceId }, "GraphQLService cache miss — querying Postgres");
      service = await this.graphqlServiceRepository.findById(operation.graphQLServiceId);
      if (!service) {
        throw new NotFoundError(`GraphQL service with ID "${operation.graphQLServiceId}" not found`);
      }
      await this.cache.set(serviceKey, service, CACHE_TTL_SECONDS);
    }

    const { endpoint, name: serviceName } = service;

    logger.info(
      { operationName, serviceName, endpoint, runtime: decision.runtime },
      "Forwarding GraphQL request to upstream service"
    );

    // ── Step 5: Forward the exact GraphQL request ────────────────────────────
    const upstreamResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        operationName,
        ...(variables !== undefined && { variables }),
      }),
    });

    if (!upstreamResponse.ok) {
      logger.error(
        { serviceName, endpoint, status: upstreamResponse.status },
        "Upstream GraphQL service returned a non-2xx status"
      );
      throw new Error(
        `Upstream service responded with ${upstreamResponse.status} ${upstreamResponse.statusText}`
      );
    }

    // ── Step 6: Return the upstream response verbatim ────────────────────────
    const result = (await upstreamResponse.json()) as GatewayForwardResult;

    logger.info(
      { operationName, serviceName, hasErrors: Array.isArray(result.errors) && result.errors.length > 0 },
      "Received response from upstream service"
    );

    return result;
  }
}
