import { Router, type Request, type Response } from "express";
import { GatewayService } from "./gateway.service.js";
import { GraphQLParserService } from "./graphql-parser.service.js";
import { RequestResolverService } from "./request-resolver.service.js";
import { PrismaOperationRepository } from "../operation/operation.repository.js";
import { PrismaGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import { PrismaRoutingPolicyRepository } from "../routing-policy/routing-policy.repository.js";
import { MetricsService } from "../metrics/metrics.service.js";
import { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import { RuntimeService } from "../runtime/runtime.service.js";
import { cacheService } from "../../shared/cache/cache.service.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { AppError } from "../../shared/errors/AppError.js";
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
const runtimeService = new RuntimeService(decisionEngineService);
const graphqlParserService = new GraphQLParserService();
const requestResolverService = new RequestResolverService(
  operationRepository,
  routingPolicyRepository,
  graphqlServiceRepository,
  cacheService
);

export const gatewayService = new GatewayService(
  graphqlParserService,
  requestResolverService,
  decisionEngineService,
  runtimeService
);

export function createGatewayRouter(customGatewayService: GatewayService = gatewayService): Router {
  const router = Router();

  /**
   * POST /gateway
   *
   * Sprint 20: Automatic GraphQL Request Resolution
   * The client sends a standard GraphQL payload (no serviceName needed):
   * {
   *   "query": "query GetProducts { products { id name } }",
   *   "variables": {}
   * }
   */
  router.post(
    "/",
    async (req: Request, res: Response): Promise<void> => {
      const { query, variables } = req.body as {
        query?: string;
        variables?: Record<string, unknown>;
      };

      const requestIdHeader = req.headers["x-request-id"];
      const requestId = typeof requestIdHeader === "string" ? requestIdHeader : undefined;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
          errors: [{ message: "Every GraphQL operation must be named." }],
        });
        return;
      }

      try {
        const result = await customGatewayService.forward({
          query,
          ...(variables !== undefined && { variables }),
          ...(requestId !== undefined && { requestId }),
        });

        // Return the upstream response transparently
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          logger.warn({ message: error.message }, "Gateway resource not found");
          res.status(404).json({ errors: [{ message: error.message }] });
          return;
        }

        if (error instanceof ValidationError) {
          logger.warn({ message: error.message }, "Gateway validation error");
          res.status(400).json({ errors: [{ message: error.message }] });
          return;
        }

        if (error instanceof AppError) {
          logger.warn({ message: error.message, statusCode: error.statusCode }, "Gateway application error");
          res.status(error.statusCode).json({ errors: [{ message: error.message }] });
          return;
        }

        if (error instanceof Error) {
          logger.error({ error: error.message }, "Gateway error during forward execution");
          res.status(500).json({ errors: [{ message: error.message }] });
          return;
        }

        logger.error({ error }, "Unexpected error in gateway forwarding");
        res.status(500).json({
          errors: [{ message: "Internal gateway error" }],
        });
      }
    }
  );

  return router;
}

export const gatewayRouter = createGatewayRouter();
