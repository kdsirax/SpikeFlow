import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { startStandaloneServer } from "@apollo/server/standalone";
import express from "express";
import cors from "cors";


import { AppError } from "./shared/errors/AppError.js";

import { typeDefs as organizationTypeDefs } from "./domains/organization/organization.schema.js";
import { resolvers as organizationResolvers } from "./domains/organization/organization.resolver.js";
import { PrismaOrganizationRepository } from "./domains/organization/organization.repository.js";
import { OrganizationService } from "./domains/organization/organization.service.js";

import { typeDefs as applicationTypeDefs } from "./domains/application/application.schema.js";
import { resolvers as applicationResolvers } from "./domains/application/application.resolver.js";
import { PrismaApplicationRepository } from "./domains/application/application.repository.js";
import { ApplicationService } from "./domains/application/application.service.js";

import { typeDefs as graphqlServiceTypeDefs } from "./domains/graphql-service/graphql-service.schema.js";
import { resolvers as graphqlServiceResolvers } from "./domains/graphql-service/graphql-service.resolver.js";
import { PrismaGraphQLServiceRepository } from "./domains/graphql-service/graphql-service.repository.js";
import { GraphQLServiceService } from "./domains/graphql-service/graphql-service.service.js";

import { typeDefs as operationTypeDefs } from "./domains/operation/operation.schema.js";
import { resolvers as operationResolvers } from "./domains/operation/operation.resolver.js";
import { PrismaOperationRepository } from "./domains/operation/operation.repository.js";
import { OperationService } from "./domains/operation/operation.service.js";

import { typeDefs as routingPolicyTypeDefs } from "./domains/routing-policy/routing-policy.schema.js";
import { resolvers as routingPolicyResolvers } from "./domains/routing-policy/routing-policy.resolver.js";
import { PrismaRoutingPolicyRepository } from "./domains/routing-policy/routing-policy.repository.js";
import { RoutingPolicyService } from "./domains/routing-policy/routing-policy.service.js";

import { typeDefs as decisionEngineTypeDefs } from "./domains/decision-engine/decision-engine.schema.js";
import { resolvers as decisionEngineResolvers } from "./domains/decision-engine/decision-engine.resolver.js";
import { DecisionEngineService } from "./domains/decision-engine/decision-engine.service.js";
import { MetricsService } from "./domains/metrics/metrics.service.js";
import { RuntimeService } from "./domains/runtime/runtime.service.js";

import { gatewayRouter } from "./domains/gateway/gateway.router.js";
import { cacheService } from "./shared/cache/cache.service.js";

import { logger } from "./shared/logger/logger.js";

// Initialize repositories and services
const organizationRepository = new PrismaOrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);

const applicationRepository = new PrismaApplicationRepository();
const applicationService = new ApplicationService(applicationRepository, organizationRepository);

const graphqlServiceRepository = new PrismaGraphQLServiceRepository();
const graphqlServiceService = new GraphQLServiceService(graphqlServiceRepository, applicationRepository, cacheService);

const operationRepository = new PrismaOperationRepository();
const operationService = new OperationService(operationRepository, graphqlServiceRepository, cacheService);

const routingPolicyRepository = new PrismaRoutingPolicyRepository();
const routingPolicyService = new RoutingPolicyService(routingPolicyRepository, operationRepository, cacheService);

const metricsService = new MetricsService();
const decisionEngineService = new DecisionEngineService(operationRepository, routingPolicyRepository, metricsService);
const runtimeService = new RuntimeService(decisionEngineService);

export interface GraphQLContext {
  organizationService: OrganizationService;
  applicationService: ApplicationService;
  graphqlServiceService: GraphQLServiceService;
  operationService: OperationService;
  routingPolicyService: RoutingPolicyService;
  decisionEngineService: DecisionEngineService;
  runtimeService: RuntimeService;
}

// Merge typeDefs and resolvers
const typeDefs = [
  organizationTypeDefs,
  applicationTypeDefs,
  graphqlServiceTypeDefs,
  operationTypeDefs,
  routingPolicyTypeDefs,
  decisionEngineTypeDefs,
];

const resolvers = {
  Query: {
    ...organizationResolvers.Query,
    ...applicationResolvers.Query,
    ...graphqlServiceResolvers.Query,
    ...operationResolvers.Query,
    ...routingPolicyResolvers.Query,
  },
  Mutation: {
    ...organizationResolvers.Mutation,
    ...applicationResolvers.Mutation,
    ...graphqlServiceResolvers.Mutation,
    ...operationResolvers.Mutation,
    ...routingPolicyResolvers.Mutation,
    ...decisionEngineResolvers.Mutation,
  },
};

// Create Apollo Server instance (management API)
export const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    const originalError = unwrapResolverError(error);
    if (originalError instanceof AppError) {
      return {
        message: originalError.message,
        statusCode: originalError.statusCode,
      };
    }
    return {
      message: formattedError.message,
      statusCode: 500,
    };
  },
});

// ─── Gateway Express app (POST /gateway forwarding proxy) ────────────────────
function startGatewayServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Step 1: POST /gateway — accepts any GraphQL query and forwards it upstream
  app.use("/gateway", gatewayRouter);

  const GATEWAY_PORT = 4001;
  app.listen(GATEWAY_PORT, () => {
    logger.info(`   • GraphQL forwarding proxy →  http://localhost:${GATEWAY_PORT}/gateway`);
  });
}

// ─── Apollo management API (GraphQL Studio) ──────────────────────────────────
export async function startServer() {
  // Start the Express gateway on port 4001
  startGatewayServer();

  // Start Apollo's standalone server on port 4000
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      organizationService,
      applicationService,
      graphqlServiceService,
      operationService,
      routingPolicyService,
      decisionEngineService,
      runtimeService,
    }),
    listen: { port: 4000 },
  });

  logger.info(`🚀 Application started:`);
  logger.info(`   • GraphQL management API  →  ${url}`);
}
