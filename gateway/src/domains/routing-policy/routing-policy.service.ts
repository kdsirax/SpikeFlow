import type { IRoutingPolicyRepository } from "./routing-policy.repository.js";
import type { IOperationRepository } from "../operation/operation.repository.js";
import type { CreateRoutingPolicyInput, RoutingPolicy } from "./routing-policy.types.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export class RoutingPolicyService {
  constructor(
    private readonly repository: IRoutingPolicyRepository,
    private readonly operationRepository: IOperationRepository
  ) {}

  async createRoutingPolicy(input: CreateRoutingPolicyInput): Promise<RoutingPolicy> {
    const operation = await this.operationRepository.findById(input.operationId);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }

    const created = await this.repository.create(input);
    logger.info({ policyId: created.id, operationId: created.operationId }, "Routing policy created");
    return created;
  }

  async getRoutingPolicies(): Promise<RoutingPolicy[]> {
    return this.repository.findAll();
  }

  async getRoutingPolicyById(id: string): Promise<RoutingPolicy | null> {
    return this.repository.findById(id);
  }
}
