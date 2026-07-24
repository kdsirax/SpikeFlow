import type { CreateOperationInput } from "./operation.types.js";
import type { OperationService } from "./operation.service.js";

interface OperationContext {
  operationService: OperationService;
}

export const resolvers = {
  Query: {
    operations: async (
      _parent: unknown,
      _args: unknown,
      context: OperationContext
    ) => {
      return context.operationService.getOperations();
    },
    operation: async (
      _parent: unknown,
      { id }: { id: string },
      context: OperationContext
    ) => {
      return context.operationService.getOperationById(id);
    },
  },
  Mutation: {
    createOperation: async (
      _parent: unknown,
      { input }: { input: CreateOperationInput },
      context: OperationContext
    ) => {
      return context.operationService.createOperation(input);
    },
  },
};
