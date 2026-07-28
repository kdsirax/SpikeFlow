import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";

export class ServerlessExecutor implements RuntimeExecutor {
  async execute(_request: ExecutionRequest): Promise<ExecutionResult> {
    return {
      success: true,
      data: "Executed using Serverless",
    };
  }
}
