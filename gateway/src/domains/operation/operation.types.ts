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
