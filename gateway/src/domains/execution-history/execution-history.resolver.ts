import type { ExecutionHistoryService } from "./execution-history.service.js";

interface ExecutionHistoryContext {
  executionHistoryService: ExecutionHistoryService;
}

export const resolvers = {
  Query: {
    executionHistory: async (
      _parent: unknown,
      _args: unknown,
      context: ExecutionHistoryContext
    ) => {
      return context.executionHistoryService.getExecutionHistory();
    },
    executionHistoryById: async (
      _parent: unknown,
      { id }: { id: string },
      context: ExecutionHistoryContext
    ) => {
      return context.executionHistoryService.getExecutionById(id);
    },
    executionHistoryByOperation: async (
      _parent: unknown,
      { operationId }: { operationId: string },
      context: ExecutionHistoryContext
    ) => {
      return context.executionHistoryService.getExecutionHistoryByOperation(operationId);
    },
  },
};
