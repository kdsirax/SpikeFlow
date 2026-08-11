import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";
import { logger } from "../../shared/logger/logger.js";

export class ServerlessRuntimeExecutor implements RuntimeExecutor {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { operationName, requestId } = request;

    logger.debug(
      {
        requestId,
        operationName,
        runtime: "Serverless",
      },
      "Executing request via Serverless Runtime Executor (Mock Lambda)"
    );

    return {
      runtime: "Serverless",
      message: "Mock execution",
      data: {
        runtime: "Serverless",
        message: "Mock execution",
      },
    };
  }
}

export { ServerlessRuntimeExecutor as ServerlessExecutor };
