export interface GatewayForwardRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string; // optional override; otherwise parsed from query AST
  requestId?: string; // optional tracing ID; generated if omitted
}

export interface GatewayForwardResult {
  data?: unknown;
  errors?: unknown[];
}
