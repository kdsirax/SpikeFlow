export const resolvers = {
    Query: {
        graphqlServices: async (_parent, _args, context) => {
            return context.graphqlServiceService.getGraphQLServices();
        },
        graphqlService: async (_parent, { id }, context) => {
            return context.graphqlServiceService.getGraphQLServiceById(id);
        },
    },
    Mutation: {
        createGraphQLService: async (_parent, { input }, context) => {
            return context.graphqlServiceService.createGraphQLService(input);
        },
    },
};
//# sourceMappingURL=graphql-service.resolver.js.map