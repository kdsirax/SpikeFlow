import type { RuntimeDecision } from "../decision-engine/decison-engine.types.js";

export interface ExecutionRequest {
  query: string;
  variables?: Record<string, unknown> | undefined;
  operationName?: string | undefined;
  requestId?: string | undefined;
  targetUrl?: string | undefined;
  decision?: RuntimeDecision | undefined;
  operationId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export type ExecutionContext = ExecutionRequest;

export interface ExecutionResult {
  data?: unknown;
  errors?: unknown[] | undefined;
  runtime?: string | undefined;
  message?: string | undefined;
  success?: boolean | undefined;
  [key: string]: unknown;
}

export type ExecutionResponse = ExecutionResult;

export interface RuntimeExecutor {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
