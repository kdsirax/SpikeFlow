import { Router, type Request, type Response } from "express";
import { GatewayService } from "./gateway.service.js";
import { PrismaOperationRepository } from "../operation/operation.repository.js";
import { PrismaGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import { PrismaRoutingPolicyRepository } from "../routing-policy/routing-policy.repository.js";
import { MetricsService } from "../metrics/metrics.service.js";
import { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import { cacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

// Wire up the full dependency chain
const operationRepository = new PrismaOperationRepository();
const graphqlServiceRepository = new PrismaGraphQLServiceRepository();
const routingPolicyRepository = new PrismaRoutingPolicyRepository();
const metricsService = new MetricsService();
const decisionEngineService = new DecisionEngineService(
  operationRepository,
  routingPolicyRepository,
  metricsService
);

const gatewayService = new GatewayService(
  operationRepository,
  graphqlServiceRepository,
  decisionEngineService,
  cacheService
);

export const gatewayRouter = Router();

/**
 * POST /gateway
 *
 * Transparent, operation-aware GraphQL forwarding proxy.
 *
 * The client sends a standard GraphQL payload — no service name required.
 * SpikeFlow resolves the target internally:
 *
 *   parse query AST → extract operationName
 *       ↓
 *   Redis? (operation:{name}) → Postgres fallback → store in Redis
 *       ↓
 *   DecisionEngine.makeRoutingDecision(operation.id)
 *       ↓
 *   Redis? (graphql-service:{id}) → Postgres fallback → store in Redis
 *       ↓
 *   fetch(endpoint, rawBody)
 *       ↓
 *   return upstream response
 *
 * Body:
 * {
 *   "query":         "query GetProducts { getProducts { id name } }",  // required, must be named
 *   "variables":     { ... },       // optional
 *   "operationName": "GetProducts"  // optional — parsed from query if omitted
 * }
 */
gatewayRouter.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const { query, variables, operationName } = req.body as {
      query?: string;
      variables?: Record<string, unknown>;
      operationName?: string;
    };

    if (!query) {
      res.status(400).json({
        errors: [{ message: "`query` is required in the request body" }],
      });
      return;
    }

    try {
      const result = await gatewayService.forward({
        query,
        ...(variables !== undefined && { variables }),
        ...(operationName !== undefined && { operationName }),
      });

      // Return the upstream response verbatim — client sees it as a single API
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ errors: [{ message: error.message }] });
        return;
      }

      // Parse errors / unnamed operation errors
      if (error instanceof Error && !("statusCode" in error)) {
        logger.warn({ message: error.message }, "Gateway rejected request");
        res.status(400).json({ errors: [{ message: error.message }] });
        return;
      }

      logger.error({ error }, "Unexpected error in gateway forwarding");
      res.status(500).json({
        errors: [{ message: "Internal gateway error" }],
      });
    }
  }
);
