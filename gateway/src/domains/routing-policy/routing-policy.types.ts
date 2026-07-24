export enum Runtime {
  DOCKER = "DOCKER",
  SERVERLESS = "SERVERLESS",
}

export interface RoutingPolicy {
  id: string;
  operationId: string;
  preferredRuntime: Runtime;
  cpuThreshold: number;
  requestThreshold: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutingPolicyInput {
  operationId: string;
  preferredRuntime: Runtime;
  cpuThreshold: number;
  requestThreshold: number;
  enabled: boolean;
}
