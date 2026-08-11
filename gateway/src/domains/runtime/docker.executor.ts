import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";
import { logger } from "../../shared/logger/logger.js";

export class DockerRuntimeExecutor implements RuntimeExecutor {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { targetUrl, query, variables, operationName, requestId } = request;

    if (!targetUrl) {
      throw new Error("Target URL is required for Docker runtime execution.");
    }

    logger.debug(
      {
        requestId,
        operationName,
        targetUrl,
        runtime: "Docker",
      },
      "Executing request via Docker Runtime Executor"
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (requestId) {
      headers["x-request-id"] = requestId;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        ...(operationName && { operationName }),
        ...(variables !== undefined && { variables }),
      }),
    });

    if (!response.ok) {
      logger.error(
        {
          requestId,
          operationName,
          targetUrl,
          status: response.status,
          statusText: response.statusText,
        },
        "Docker runtime upstream service returned a non-2xx status"
      );
      throw new Error(
        `Upstream service responded with ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as ExecutionResult;
    return result;
  }
}

export { DockerRuntimeExecutor as DockerExecutor };
