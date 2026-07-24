import type { CreateGraphQLServiceInput } from "./graphql-service.types.js";
import type { GraphQLServiceService } from "./graphql-service.service.js";

interface GraphQLServiceContext {
  graphqlServiceService: GraphQLServiceService;
}

export const resolvers = {
  Query: {
    graphqlServices: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLServiceContext
    ) => {
      return context.graphqlServiceService.getGraphQLServices();
    },
    graphqlService: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLServiceContext
    ) => {
      return context.graphqlServiceService.getGraphQLServiceById(id);
    },
  },
  Mutation: {
    createGraphQLService: async (
      _parent: unknown,
      { input }: { input: CreateGraphQLServiceInput },
      context: GraphQLServiceContext
    ) => {
      return context.graphqlServiceService.createGraphQLService(input);
    },
  },
};
