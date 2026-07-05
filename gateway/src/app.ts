import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs as organizationTypeDefs } from "./domains/organization/organization.schema.js";
import { resolvers as organizationResolvers } from "./domains/organization/organization.resolver.js";
import { MemoryOrganizationRepository } from "./domains/organization/organization.repository.js";
import { OrganizationService } from "./domains/organization/organization.service.js";

import { typeDefs as applicationTypeDefs } from "./domains/application/application.schema.js";
import { resolvers as applicationResolvers } from "./domains/application/application.resolver.js";
import { MemoryApplicationRepository } from "./domains/application/application.repository.js";
import { ApplicationService } from "./domains/application/application.service.js";

// Initialize repositories and services
const organizationRepository = new MemoryOrganizationRepository();
const organizationService = new OrganizationService(organizationRepository);

const applicationRepository = new MemoryApplicationRepository();
const applicationService = new ApplicationService(applicationRepository, organizationRepository);

export interface GraphQLContext {
  organizationService: OrganizationService;
  applicationService: ApplicationService;
}

// Merge typeDefs and resolvers
const typeDefs = [organizationTypeDefs, applicationTypeDefs];
const resolvers = {
  Query: {
    ...organizationResolvers.Query,
    ...applicationResolvers.Query,
  },
  Mutation: {
    ...organizationResolvers.Mutation,
    ...applicationResolvers.Mutation,
  },
};

// Create Apollo Server instance
export const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

// Start standalone server
export async function startServer() {
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      organizationService,
      applicationService,
    }),
    listen: { port: 4000 },
  });
  console.log(`🚀 Server ready at ${url}`);
}
