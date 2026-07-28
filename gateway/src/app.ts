import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { startStandaloneServer } from "@apollo/server/standalone";

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

import { logger } from "./shared/logger/logger.js";

// Initialize repositories and services
const organizationRepository = new PrismaOrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);

const applicationRepository = new PrismaApplicationRepository();
const applicationService = new ApplicationService(applicationRepository, organizationRepository);

const graphqlServiceRepository = new PrismaGraphQLServiceRepository();
const graphqlServiceService = new GraphQLServiceService(graphqlServiceRepository, applicationRepository);

const operationRepository = new PrismaOperationRepository();
const operationService = new OperationService(operationRepository, graphqlServiceRepository);

const routingPolicyRepository = new PrismaRoutingPolicyRepository();
const routingPolicyService = new RoutingPolicyService(routingPolicyRepository, operationRepository);

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

// Create Apollo Server instance
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

// Start standalone server
export async function startServer() {
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
  logger.info(`🚀 Application started: Server ready at ${url}`);
}
