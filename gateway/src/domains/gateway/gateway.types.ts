export interface GatewayForwardRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string; // optional client override; otherwise parsed from query AST
}

export interface GatewayForwardResult {
  data?: unknown;
  errors?: unknown[];
}
