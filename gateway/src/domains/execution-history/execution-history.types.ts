export interface ExecutionHistory {
  id: string;
  operationId: string;
  runtimeChosen: string;
  decisionReason?: string | null | undefined;
  cpuUsage?: number | null | undefined;
  memoryUsage?: number | null | undefined;
  cacheHit: boolean;
  responseTime: number;
  status: string;
  createdAt: string;
}

export interface CreateExecutionHistoryInput {
  operationId: string;
  runtimeChosen: string;
  decisionReason?: string | null | undefined;
  cpuUsage?: number | null | undefined;
  memoryUsage?: number | null | undefined;
  cacheHit: boolean;
  responseTime: number;
  status: string;
}
