export const resolvers = {
    Query: {
        operations: async (_parent, _args, context) => {
            return context.operationService.getOperations();
        },
        operation: async (_parent, { id }, context) => {
            return context.operationService.getOperationById(id);
        },
    },
    Mutation: {
        createOperation: async (_parent, { input }, context) => {
            return context.operationService.createOperation(input);
        },
    },
};
//# sourceMappingURL=operation.resolver.js.map