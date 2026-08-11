export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
}

export interface Application {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  organizationId: string;
  name: string;
  description: string;
}

export interface UpdateApplicationInput {
  organizationId?: string;
  name?: string;
  description?: string;
}

export interface GraphQLService {
  id: string;
  applicationId: string;
  name: string;
  endpoint: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGraphQLServiceInput {
  applicationId: string;
  name: string;
  endpoint: string;
  environment: string;
}

export interface UpdateGraphQLServiceInput {
  applicationId?: string;
  name?: string;
  endpoint?: string;
  environment?: string;
}

export type EstimatedCost = "LOW" | "MEDIUM" | "HIGH";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type OperationType = "QUERY" | "MUTATION";

export interface Operation {
  id: string;
  graphQLServiceId: string;
  name: string;
  type: OperationType;
  estimatedCost: EstimatedCost;
  cacheable: boolean;
  requiresDatabase: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationInput {
  graphQLServiceId: string;
  name: string;
  type: OperationType;
  estimatedCost: EstimatedCost;
  cacheable: boolean;
  requiresDatabase: boolean;
  priority: Priority;
}

export interface UpdateOperationInput {
  graphQLServiceId?: string;
  name?: string;
  type?: OperationType;
  estimatedCost?: EstimatedCost;
  cacheable?: boolean;
  requiresDatabase?: boolean;
  priority?: Priority;
}

export type Runtime = "DOCKER" | "SERVERLESS";

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

export interface UpdateRoutingPolicyInput {
  operationId?: string;
  preferredRuntime?: Runtime;
  cpuThreshold?: number;
  requestThreshold?: number;
  enabled?: boolean;
}

export interface ExecutionHistory {
  id: string;
  operationId: string;
  runtimeChosen: string;
  decisionReason?: string | null;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  cacheHit: boolean;
  responseTime: number;
  status: string;
  createdAt: string;
}

export interface RuntimeStat {
  runtime: string;
  count: number;
  percentage: number;
}

export interface PerformancePoint {
  id: string;
  time: string;
  timestamp: number;
  responseTime: number;
  operationName: string;
  runtime: string;
  status: string;
  cacheHit: boolean;
}

export interface DashboardMetrics {
  totalRequests: number;
  avgLatency: number;
  cacheHitRate: number;
  failureRate: number;
  runtimeDistribution: RuntimeStat[];
  performanceSeries: PerformancePoint[];
  recentExecutions: ExecutionHistory[];
}
