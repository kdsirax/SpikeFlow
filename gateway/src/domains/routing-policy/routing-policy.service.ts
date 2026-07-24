import { randomUUID } from "crypto";
import type { IRoutingPolicyRepository } from "./routing-policy.repository.js";
import type { IOperationRepository } from "../operation/operation.repository.js";
import type { CreateRoutingPolicyInput, RoutingPolicy } from "./routing-policy.types.js";

export class RoutingPolicyService {
  constructor(
    private readonly repository: IRoutingPolicyRepository,
    private readonly operationRepository: IOperationRepository
  ) {}

  async createRoutingPolicy(input: CreateRoutingPolicyInput): Promise<RoutingPolicy> {
    const operation = await this.operationRepository.findById(input.operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }

    const now = new Date();
    const policy: RoutingPolicy = {
      id: randomUUID(),
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    return this.repository.create(policy);
  }

  async getRoutingPolicies(): Promise<RoutingPolicy[]> {
    return this.repository.findAll();
  }

  async getRoutingPolicyById(id: string): Promise<RoutingPolicy | undefined> {
    return this.repository.findById(id);
  }
}
