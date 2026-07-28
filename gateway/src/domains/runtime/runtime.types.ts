export interface ExecutionRequest {
  operationId: string;
  query: string;
  variables?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface RuntimeExecutor {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
