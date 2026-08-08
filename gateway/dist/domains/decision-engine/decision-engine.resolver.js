export const resolvers = {
    Mutation: {
        makeRoutingDecision: async (_parent, { operationId }, context) => {
            return context.decisionEngineService.makeRoutingDecision(operationId);
        },
    },
};
//# sourceMappingURL=decision-engine.resolver.js.map