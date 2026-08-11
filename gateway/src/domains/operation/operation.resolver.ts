import type { CreateOperationInput, UpdateOperationInput } from "./operation.types.js";
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
    updateOperation: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateOperationInput },
      context: OperationContext
    ) => {
      return context.operationService.updateOperation(id, input);
    },
    deleteOperation: async (
      _parent: unknown,
      { id }: { id: string },
      context: OperationContext
    ) => {
      return context.operationService.deleteOperation(id);
    },
  },
};
