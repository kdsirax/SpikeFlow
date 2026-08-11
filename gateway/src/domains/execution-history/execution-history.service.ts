import type { IExecutionHistoryRepository } from "./execution-history.repository.js";
import type { CreateExecutionHistoryInput, ExecutionHistory } from "./execution-history.types.js";
import { logger } from "../../shared/logger/logger.js";

export class ExecutionHistoryService {
  constructor(private readonly repository: IExecutionHistoryRepository) {}

  async recordExecution(input: CreateExecutionHistoryInput): Promise<ExecutionHistory> {
    try {
      const created = await this.repository.create(input);
      logger.info(
        {
          executionId: created.id,
          operationId: created.operationId,
          runtime: created.runtimeChosen,
          responseTime: created.responseTime,
          status: created.status,
          cacheHit: created.cacheHit,
        },
        "Execution recorded"
      );
      return created;
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          operationId: input.operationId,
        },
        "Failed to record execution history"
      );
      throw error;
    }
  }

  async getExecutionHistory(): Promise<ExecutionHistory[]> {
    return this.repository.findAll();
  }

  async getExecutionById(id: string): Promise<ExecutionHistory | null> {
    return this.repository.findById(id);
  }

  async getExecutionHistoryByOperation(operationId: string): Promise<ExecutionHistory[]> {
    return this.repository.findByOperationId(operationId);
  }
}
