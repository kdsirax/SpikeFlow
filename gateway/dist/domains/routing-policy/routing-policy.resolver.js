export const resolvers = {
    Query: {
        routingPolicies: async (_parent, _args, context) => {
            return context.routingPolicyService.getRoutingPolicies();
        },
        routingPolicy: async (_parent, { id }, context) => {
            return context.routingPolicyService.getRoutingPolicyById(id);
        },
    },
    Mutation: {
        createRoutingPolicy: async (_parent, { input }, context) => {
            return context.routingPolicyService.createRoutingPolicy(input);
        },
    },
};
//# sourceMappingURL=routing-policy.resolver.js.map